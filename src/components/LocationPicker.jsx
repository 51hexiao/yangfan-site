import { useEffect, useRef, useState } from "react";
import { currentMode, hasAmapKey, loadAmap, mapStyleFor } from "../utils/amap.js";
import { matchIcon as matchPoiIcon } from "../utils/exploreIcons.js";

// 高德 POI 类型码 05 开头是「餐饮服务」，按这个把选中的地点自动归到「吃饭」
const isFoodPoi = (poi) => {
  const code = String(poi?.typecode ?? "");
  if (code.startsWith("05")) return true;
  return /餐饮|美食|餐厅|饭馆|菜馆|小吃|快餐|咖啡|茶座|酒吧|甜品|面包|火锅|烧烤/.test(
    String(poi?.type ?? ""),
  );
};

// 写作页的定位选择器：搜地点（联想下拉）/ 地图上点一下 / 回到当前位置，自动回填地名与经纬度
export default function LocationPicker({ value, onChange }) {
  const boxRef = useRef(null);
  const searchRef = useRef(null); // 搜索框所在行，联想下拉挂在它下面
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const placeSearchRef = useRef(null);
  const geoRef = useRef(null);
  const autoRef = useRef(null);
  const debounceRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // 父级每次渲染都会传新函数，用 ref 兜住最新引用，地图回调里始终调到最新的
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [status, setStatus] = useState(hasAmapKey ? "loading" : "no-key");
  const [detail, setDetail] = useState("");
  const [keyword, setKeyword] = useState(value?.place ?? "");
  const [sugs, setSugs] = useState([]);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState("");

  // 初始化地图 + 搜索联想 + 定位
  useEffect(() => {
    if (!hasAmapKey) return;
    let alive = true;
    loadAmap()
      .then((AMap) => {
        const box = boxRef.current;
        if (!alive || !box) return;
        const center = value?.lng && value?.lat ? [value.lng, value.lat] : [120.15, 30.25];
        const map = new AMap.Map(box, {
          zoom: value?.lng ? 16 : 11,
          center,
          viewMode: "2D",
          mapStyle: mapStyleFor(currentMode()),
          zooms: [3, 18],
        });
        mapRef.current = map;
        geocoderRef.current = new AMap.Geocoder({});
        placeSearchRef.current = new AMap.PlaceSearch({ city: "全国" });
        geoRef.current = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 9000 });
        autoRef.current = new AMap.AutoComplete({ city: "全国" });

        const commit = (lng, lat, place, matched) => {
          if (markerRef.current) {
            markerRef.current.setPosition([lng, lat]);
          } else {
            markerRef.current = new AMap.Marker({ position: [lng, lat], anchor: "bottom-center" });
            markerRef.current.setMap(map);
          }
          if (place) setKeyword(place);
          onChangeRef.current?.({
            place: place ?? "",
            lng,
            lat,
            matchedType: matched?.type,
            matchedIcon: matched?.icon,
          });
        };

        const reverse = (lng, lat) => {
          geocoderRef.current.getAddress([lng, lat], (s, r) => {
            const addr =
              s === "complete" && r?.regeocode
                ? r.regeocode.formattedAddress || r.regeocode.addressComponent?.township || ""
                : "";
            if (s !== "complete") {
              setLocNote(
                "逆地理失败：高德服务类接口报错了，多半是 .env.local 里没配 VITE_AMAP_SECURITY（安全密钥）",
              );
            }
            commit(lng, lat, addr);
          });
        };

        map.on("click", (e) => reverse(e.lnglat.getLng(), e.lnglat.getLat()));

        // 选中一条联想：地图中心飞过去，这里就是要记的坐标；
        // 顺带用 PlaceSearch 查 POI 类型，给上面的「吃饭/景点」一个自动匹配
        const pick = (tip) => {
          const loc = tip?.location;
          if (!loc) return;
          // AMap.LngLat 的坐标要用 getLng()/getLat() 取，普通对象则直接读 lng/lat
          const lng = typeof loc.getLng === "function" ? loc.getLng() : Number(loc.lng);
          const lat = typeof loc.getLat === "function" ? loc.getLat() : Number(loc.lat);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          map.setZoomAndCenter(16, [lng, lat]);
          const name = [tip.name, tip.district || tip.address].filter(Boolean).join(" · ");
          commit(lng, lat, name || tip.name || "");
          setSugs([]);
          inputRef.current?.blur();
          if (tip.id && placeSearchRef.current) {
            placeSearchRef.current.getDetails(tip.id, (s, r) => {
              if (!alive || s !== "complete") return;
              const poi = r?.poiList?.pois?.[0] ?? r?.poi ?? null;
              if (poi) {
                const name = [tip.name, tip.district || tip.address].filter(Boolean).join(" · ");
                commit(lng, lat, name, {
                  type: isFoodPoi(poi) ? "food" : "spot",
                  icon: matchPoiIcon(poi),
                });
              }
            });
          }
        };

        if (value?.lng && value?.lat) {
          markerRef.current = new AMap.Marker({ position: [value.lng, value.lat], anchor: "bottom-center" });
          markerRef.current.setMap(map);
        }

        setStatus("ready");
        // React 侧的搜索下拉与定位按钮通过容器拿到这些闭包
        box.__amapPick = pick;
        box.__amapReverse = reverse;
      })
      .catch((err) => {
        if (!alive) return;
        setDetail(err?.message ?? "未知错误");
        setStatus(err?.message === "AMAP_KEY_MISSING" ? "no-key" : "error");
      });

    return () => {
      alive = false;
      markerRef.current = null;
      geocoderRef.current = null;
      placeSearchRef.current = null;
      geoRef.current = null;
      autoRef.current = null;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 输入联想：不绑 AMap 自带下拉，自己拿结果渲染，样式和层级都可控
  const onKeywordChange = (v) => {
    setKeyword(v);
    setLocNote("");
    clearTimeout(debounceRef.current);
    if (!v.trim() || !autoRef.current) {
      setSugs([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      autoRef.current.search(v.trim(), (s, r) => {
        if (s === "complete") {
          setSugs((r?.tips ?? []).filter((t) => t.location));
        } else {
          setSugs([]);
          setLocNote(
            "地点联想不可用：高德服务类接口报错了，多半是 .env.local 里没配 VITE_AMAP_SECURITY（安全密钥），填好后重启 npm run dev",
          );
        }
      });
    }, 250);
  };

  const chooseSug = (tip) => {
    // 用 mousedown 触发，抢在输入框 blur 关掉下拉之前
    boxRef.current?.__amapPick?.(tip);
  };

  // 回到当前位置（AMap.Geolocation 返回的已是 GCJ-02 坐标，不会偏移）
  const locate = () => {
    const map = mapRef.current;
    const geo = geoRef.current;
    if (!map || !geo || locating) return;
    setLocating(true);
    setLocNote("");
    geo.getCurrentPosition((s, r) => {
      setLocating(false);
      if (s !== "complete" || !r?.position) {
        setLocNote("没拿到定位：检查浏览器定位权限，或直接在地图上点一下");
        return;
      }
      // Geolocation 返回的 position 是 AMap.LngLat，坐标要用 getLng()/getLat() 取
      const lng =
        typeof r.position.getLng === "function" ? r.position.getLng() : Number(r.position.lng);
      const lat =
        typeof r.position.getLat === "function" ? r.position.getLat() : Number(r.position.lat);
      map.setZoomAndCenter(16, [lng, lat]);
      // 中心与坐标带过去，地名交给逆地理（和地图点选同一条路径）
      boxRef.current?.__amapReverse?.(lng, lat);
    });
  };

  return (
    <div className="loc-picker">
      <div className="loc-search" ref={searchRef}>
        <input
          ref={inputRef}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onBlur={() => setTimeout(() => setSugs([]), 150)}
          placeholder="搜地点：海底捞、万象城、西湖断桥…"
          spellCheck={false}
        />
        <span className="loc-search-hint">或直接在地图上点一下</span>

        {sugs.length > 0 && (
          <div className="loc-sugs" role="listbox" aria-label="地点联想">
            {sugs.map((t) => (
              <button
                type="button"
                role="option"
                key={t.id || `${t.name}-${t.address}`}
                className="loc-sug-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  chooseSug(t);
                }}
              >
                <span className="loc-sug-name">{t.name}</span>
                <span className="loc-sug-district">{[t.district, t.address].filter(Boolean).join(" ")}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="loc-map" ref={boxRef} aria-label="定位选择">
        {status === "ready" && (
          <button
            type="button"
            className={`loc-locate${locating ? " is-locating" : ""}`}
            title="回到我当前的位置"
            aria-label="回到我当前的位置"
            onClick={locate}
          >
            {locating ? "…" : "⌖"}
          </button>
        )}

        {status === "loading" && <span className="loc-mask-text">地图加载中…</span>}
        {status === "no-key" && (
          <span className="loc-mask-text">
            还没配高德 key，先跳过定位写字也行（可稍后再补）
          </span>
        )}
        {status === "error" && <span className="loc-mask-text">{detail}</span>}
      </div>

      {locNote ? (
        <div className="loc-current loc-note">
          <span>{locNote}</span>
        </div>
      ) : null}

      {value?.place ? (
        <div className="loc-current">
          <span className="loc-current-label">当前定位</span>
          <span className="loc-current-value">{value.place}</span>
          {value.lng ? (
            <span className="loc-current-geo">
              {value.lng.toFixed(5)}, {value.lat.toFixed(5)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
