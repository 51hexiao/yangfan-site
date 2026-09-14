import { useEffect, useMemo, useRef, useState } from "react";
import {
  cssVar,
  currentMode,
  escapeHtml,
  hasAmapKey,
  loadAmap,
  mapStyleFor,
} from "../utils/amap.js";
import { cityOf, pathKm } from "../utils/explore.js";
import { iconEmoji } from "../utils/exploreIcons.js";

// 图钉：emoji 图标（未配置时按类型兜底）+ 右下角小序号；吃饭=奶油琥珀，景点=墨绿
function pinHtml(p) {
  const ico = iconEmoji(p);
  return `<div class="trail-pin trail-pin-${p.type}${p.active ? " is-active" : ""}">
    <span class="trail-pin-ico">${ico}</span>
    <span class="trail-pin-no">${String(p.no).padStart(2, "0")}</span>
  </div>`;
}

function popHtml(p) {
  const ico = iconEmoji(p);
  const cover = p.cover
    ? `<span class="trail-pop-cover"><img src="${escapeHtml(p.cover)}" alt="" /></span>`
    : "";
  return `<div class="trail-pop">
    <span class="trail-pop-top">
      <span class="trail-pop-no">NO.${String(p.no).padStart(2, "0")}</span>
      <span class="trail-pop-ico">${ico}</span>
      <span class="trail-pop-type">${p.type === "food" ? "吃饭" : "景点"}</span>
    </span>
    <strong class="trail-pop-title">${escapeHtml(p.title)}</strong>
    <span class="trail-pop-meta">${escapeHtml(p.date)}${p.place ? " · " + escapeHtml(p.place) : ""}</span>
    ${cover}
  </div>`;
}

export default function TrailMap({ points = [], activeSlug, onSelect }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const amapRef = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]); // 城内段 + 跨城段全部折线
  const boatRef = useRef(null);
  const infoRef = useRef(null);
  const fittedRef = useRef(false);
  const selectRef = useRef(onSelect);
  const ptsRef = useRef([]); // 给容器事件委托反查当前点集用
  const pinClickRef = useRef(null);

  const mileage = useMemo(() => Math.round(pathKm(points)), [points]);

  // 父级的 onSelect 每次渲染都可能换新函数，用 ref 兜住最新引用，避免反复重建标记
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  const [status, setStatus] = useState(hasAmapKey ? "loading" : "no-key");
  const [detail, setDetail] = useState("");
  const [mode, setMode] = useState(currentMode);
  // 地图工具条：定位 / 全览 / 跟随帆船 / 航线开关
  const [locating, setLocating] = useState(false);
  const [following, setFollowing] = useState(false);
  const [hasBoat, setHasBoat] = useState(false);
  const [showLine, setShowLine] = useState(true);
  const [hasLine, setHasLine] = useState(false);
  const showLineRef = useRef(true);
  const geoRef = useRef(null);
  const followRafRef = useRef(0);
  const noteTimer = useRef(null);
  const [toolNote, setToolNote] = useState("");

  const flashNote = (text) => {
    setToolNote(text);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setToolNote(""), 3000);
  };

  // 跟随帆船：镜头每帧对准巡航中的小船
  useEffect(() => {
    if (!following) return;
    let stop = false;
    const tick = () => {
      const boat = boatRef.current;
      const map = mapRef.current;
      if (boat && map) {
        const p = boat.getPosition?.();
        if (p) map.setCenter([p.getLng(), p.getLat()]);
      } else {
        setFollowing(false);
        return;
      }
      if (!stop) followRafRef.current = requestAnimationFrame(tick);
    };
    followRafRef.current = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(followRafRef.current);
    };
  }, [following]);

  useEffect(() => () => clearTimeout(noteTimer.current), []);

  // 跟随站点明暗模式
  useEffect(() => {
    const el = document.documentElement;
    const ob = new MutationObserver(() => setMode(currentMode()));
    ob.observe(el, { attributes: true, attributeFilter: ["data-mode"] });
    return () => ob.disconnect();
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!hasAmapKey) return;
    let alive = true;
    let attachedBox = null; // 挂了事件委托的容器，cleanup 时用局部引用避免 ref 已被清空
    loadAmap()
      .then((AMap) => {
        const box = boxRef.current;
        if (!alive || !box) return;
        amapRef.current = AMap;
        const map = new AMap.Map(box, {
          zoom: 12,
          center: [120.15, 30.25],
          viewMode: "2D",
          mapStyle: mapStyleFor(currentMode()),
          zooms: [3, 18],
        });
        mapRef.current = map;
        infoRef.current = new AMap.InfoWindow({ isCustom: true, offset: new AMap.Pixel(0, -44) });
        geoRef.current = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 9000 });

        // 图钉点击走容器事件委托（捕获阶段）：自定义 HTML marker 的点击会在
        // 高德内部的冒泡监听里被 stopPropagation 截走，只有捕获阶段能先拿到它；
        // 委托到地图容器按 DOM 序号反查点集，标记怎么重建都不受影响
        pinClickRef.current = (e) => {
          const pin = e.target?.closest?.(".trail-pin");
          if (!pin) return;
          const pts = ptsRef.current;
          const idx = [...box.querySelectorAll(".trail-pin")].indexOf(pin);
          const p = pts[idx];
          if (!p) return;
          selectRef.current?.(p.slug);
          if (infoRef.current) {
            infoRef.current.setContent(popHtml(p));
            infoRef.current.open(map, [p.lng, p.lat]);
          }
        };
        box.addEventListener("click", pinClickRef.current, true);
        attachedBox = box;

        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setDetail(err?.message ?? "未知错误");
        setStatus(err?.message === "AMAP_KEY_MISSING" ? "no-key" : "error");
      });

    return () => {
      alive = false;
      if (attachedBox && pinClickRef.current) {
        attachedBox.removeEventListener("click", pinClickRef.current, true);
        pinClickRef.current = null;
      }
      infoRef.current?.close();
      markersRef.current = [];
      linesRef.current = [];
      boatRef.current = null;
      geoRef.current = null;
      infoRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
      amapRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // 卡片 hover / pin 点击时，地图平滑飞到对应站点；已在视野内就不动，避免来回晃
  useEffect(() => {
    const map = mapRef.current;
    const AMap = amapRef.current;
    if (status !== "ready" || !map || !AMap || !activeSlug) return;
    const p = points.find((pt) => pt.slug === activeSlug);
    if (!p || !p.hasGeo) return;
    const pos = new AMap.LngLat(p.lng, p.lat);
    const bounds = map.getBounds?.();
    if (bounds?.contains?.(pos)) return;
    map.panTo(pos);
  }, [activeSlug, status, points]);

  // 底图风格跟随主题
  useEffect(() => {
    mapRef.current?.setMapStyle?.(mapStyleFor(mode));
  }, [mode]);

  // 标记 + 路线：点集或高亮变化时重建
  useEffect(() => {
    const map = mapRef.current;
    const AMap = amapRef.current;
    if (status !== "ready" || !map || !AMap) return;

    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];
    linesRef.current.forEach((l) => map.remove(l));
    linesRef.current = [];
    if (boatRef.current) {
      map.remove(boatRef.current);
      boatRef.current = null;
    }
    infoRef.current?.close();

    const pts = points.filter((p) => p.hasGeo);
    ptsRef.current = pts;

    markersRef.current = pts.map((p) => {
      const marker = new AMap.Marker({
        position: [p.lng, p.lat],
        content: pinHtml({ ...p, active: p.slug === activeSlug }),
        anchor: "bottom-center",
        zIndex: 100 + p.no,
        cursor: "pointer",
      });
      marker.setMap(map);
      return marker;
    });

    if (pts.length > 1) {
      // 路线按城分段：同城连成实段（主色虚线），跨城只留一条淡化连线，地图不喧宾夺主
      const lines = [];
      const runs = [];
      let run = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        if (cityOf(pts[i - 1].place) === cityOf(pts[i].place)) run.push(pts[i]);
        else {
          runs.push(run);
          run = [pts[i]];
        }
      }
      runs.push(run);

      runs.forEach((seg) => {
        if (seg.length < 2) return;
        const line = new AMap.Polyline({
          path: seg.map((p) => [p.lng, p.lat]),
          strokeColor: cssVar("--accent", "#173f37"),
          strokeWeight: 2.5,
          strokeOpacity: 0.7,
          strokeStyle: "dashed",
          strokeDasharray: [7, 7],
          lineJoin: "round",
          showDir: true,
          zIndex: 60,
        });
        line.setMap(map);
        lines.push(line);
      });

      for (let i = 1; i < runs.length; i++) {
        const a = runs[i - 1][runs[i - 1].length - 1];
        const b = runs[i][0];
        const cross = new AMap.Polyline({
          path: [
            [a.lng, a.lat],
            [b.lng, b.lat],
          ],
          strokeColor: cssVar("--text-secondary", "#8a8377"),
          strokeWeight: 1.5,
          strokeOpacity: 0.3,
          strokeStyle: "dashed",
          strokeDasharray: [3, 7],
          lineJoin: "round",
          zIndex: 55,
        });
        cross.setMap(map);
        lines.push(cross);
      }
      linesRef.current = lines;
      if (!showLineRef.current) lines.forEach((l) => l.hide());

      // 一枚小帆船沿航线巡航（扬帆意象）；插件缺失或用户偏好减弱动效时不上船。
      // MoveAnimation 在 JS API 2.0 里不能用 URL 参数直接注册，必须 AMap.plugin() 动态加载。
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        AMap.plugin("AMap.MoveAnimation", () => {
          if (!mapRef.current || mapRef.current !== map || boatRef.current) return;
          const boat = new AMap.Marker({
            position: [pts[0].lng, pts[0].lat],
            content: '<span class="trail-boat" aria-hidden="true">⛵</span>',
            anchor: "center",
            zIndex: 140,
          });
          boat.setMap(map);
          boat.moveAlong(pts.map((p) => [p.lng, p.lat]), {
            duration: Math.min(90000, 6500 * pts.length),
            autoRotation: false,
            loop: true,
          });
          boatRef.current = boat;
          setHasBoat(true);
        });
      }
    }

    if (!fittedRef.current && markersRef.current.length) {
      fittedRef.current = true;
      map.setFitView(markersRef.current, false, [70, 70, 70, 70], 15);
    }

    // 工具条按钮的可用态收进微任务里刷新，避免在 effect 中同步 setState
    queueMicrotask(() => {
      setHasLine(Boolean(linesRef.current.length));
      setHasBoat(Boolean(boatRef.current));
      if (!boatRef.current) setFollowing(false);
    });
  }, [status, points, activeSlug]);

  // —— 工具条动作 ——
  const locateMe = () => {
    const map = mapRef.current;
    const geo = geoRef.current;
    if (!map || !geo || locating) return;
    setLocating(true);
    geo.getCurrentPosition((s, r) => {
      setLocating(false);
      if (s !== "complete" || !r?.position) {
        flashNote("没拿到定位：检查浏览器定位权限");
        return;
      }
      const lng = typeof r.position.getLng === "function" ? r.position.getLng() : Number(r.position.lng);
      const lat = typeof r.position.getLat === "function" ? r.position.getLat() : Number(r.position.lat);
      map.setZoomAndCenter(14, [lng, lat]);
      flashNote("已定位到你的位置（蓝色圆点处附近）");
    });
  };

  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    setFollowing(false);
    if (markersRef.current.length) {
      map.setFitView(markersRef.current, false, [70, 70, 70, 70], 15);
    } else {
      map.setZoomAndCenter(12, [120.15, 30.25]);
    }
  };

  const toggleFollow = () => {
    if (!hasBoat) {
      flashNote("帆船还没上航线（至少两站有定位才会巡航）");
      return;
    }
    setFollowing((v) => !v);
  };

  const toggleLine = () => {
    if (!linesRef.current.length) {
      flashNote("至少两站有定位才会连线");
      return;
    }
    const next = !showLineRef.current;
    showLineRef.current = next;
    linesRef.current.forEach((l) => (next ? l.show() : l.hide()));
    setShowLine(next);
  };

  return (
    <div className="trail-map-wrap">
      <div className="trail-map" ref={boxRef} aria-label="探索地图" />

      {status === "ready" && (
        <div className="trail-tools" role="toolbar" aria-label="地图工具">
          <button
            type="button"
            className={`trail-tool${locating ? " is-busy" : ""}`}
            title="回到当前位置"
            aria-label="回到当前位置"
            onClick={locateMe}
          >
            {locating ? "…" : "⌖"}
          </button>
          <button
            type="button"
            className="trail-tool"
            title="回到全览"
            aria-label="回到全览"
            onClick={fitAll}
          >
            ⛶
          </button>
          <button
            type="button"
            className={`trail-tool${following ? " is-on" : ""}${hasBoat ? "" : " is-off"}`}
            title={hasBoat ? "镜头跟随帆船巡航" : "至少两站有定位才会开帆船"}
            aria-label="镜头跟随帆船"
            onClick={toggleFollow}
          >
            ⛵
          </button>
          <button
            type="button"
            className={`trail-tool${showLine ? " is-on" : ""}${hasLine ? "" : " is-off"}`}
            title={showLine ? "隐藏航线" : "显示航线"}
            aria-label="航线开关"
            onClick={toggleLine}
          >
            ╱
          </button>
        </div>
      )}

      {toolNote && status === "ready" && <span className="trail-tool-note">{toolNote}</span>}

      {status === "ready" && points.length > 0 && (
        <div className="trail-mileage">
          <b>{points.length}</b> 站 · 全程 ≈ <b>{mileage}</b> km
        </div>
      )}

      {status === "loading" && (
        <div className="trail-map-mask">
          <span className="trail-map-mask-title">地图正在铺开…</span>
          <span className="trail-map-mask-desc">首次加载高德底图</span>
        </div>
      )}

      {status === "no-key" && (
        <div className="trail-map-mask">
          <span className="trail-map-mask-kicker">MAP · 待通电</span>
          <span className="trail-map-mask-title">地图底图还没配 key</span>
          <span className="trail-map-mask-desc">
            去高德开放平台申请一个「Web端（JS API）」key，然后在项目根目录的{" "}
            <code>.env.local</code> 里填两行，重启 <code>npm run dev</code> 就好：
          </span>
          <pre className="trail-map-mask-code">
            VITE_AMAP_KEY=你的key{"\n"}VITE_AMAP_SECURITY=你的安全密钥
          </pre>
          <span className="trail-map-mask-desc">
            没配之前，下面的记录流照常能用，只是少了地图这一层。
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="trail-map-mask">
          <span className="trail-map-mask-kicker">MAP · 加载失败</span>
          <span className="trail-map-mask-title">底图没拉住</span>
          <span className="trail-map-mask-desc">{detail}</span>
        </div>
      )}
    </div>
  );
}
