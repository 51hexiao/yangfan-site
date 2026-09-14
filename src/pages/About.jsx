import { usePageTitle } from "../utils/usePageTitle.js";
const skills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "Node.js",
  "HTML / CSS",
  "Vite",
  "Markdown",
];

const doing = [
  {
    title: "一篇讲「个性化学习路径推荐」的专利",
    desc: "用多智能体协作的思路做推荐，最近在打磨权利要求，也在琢磨怎么写才更容易拿到授权。",
  },
  {
    title: "这间妙妙屋本身",
    desc: "从配色到版式都还在自己打磨，最近刚把几页内页的排法重新顺了一遍。",
  },
  {
    title: "把踩过的坑记下来",
    desc: "文章和笔记大多来自自己的翻车现场，写清楚一点，下次就不用再疼一遍。",
  },
];

export default function About() {
  usePageTitle("关于我");
  return (
    <div className="container page page-about">
      <span className="about-edge about-edge--left" aria-hidden="true">
        关于我 · ABOUT
      </span>
      <span className="about-edge about-edge--right" aria-hidden="true">
        肥仔妙妙屋 · MIAOMIAOWU
      </span>
      <header className="page-head">
        <span className="page-kicker">ABOUT · 关于</span>
        <h1 className="page-title">关于我</h1>
        <p className="page-subtitle">一个喜欢把想法做成东西的人</p>
      </header>

      <section className="about-id" aria-label="站点主人的名片">
        <div className="about-avatar">
          <img src="/avatar.jpg" alt="杨帆的头像" />
        </div>
        <div className="about-id-text">
          <h2 className="about-name">杨帆</h2>
          <p className="about-name-note">
            网上多叫我「肥仔」· 妙妙屋取自「扬帆」
          </p>
        </div>
        <span className="about-id-rule" aria-hidden="true" />
      </section>

      <section className="section">
        <div className="home-section-head">
          <h2 className="home-section-title">
            <span className="home-section-no">01</span>这间妙妙屋
          </h2>
        </div>
        <div className="about-lead">
          <p>
            这间妙妙屋是我自己的自留地，名字是从「扬帆」两个字谐音来的——
            算不上什么大计划，只是想有个地方，把做过的事和想过的念头存下来。
          </p>
          <p>
            整站是手搓的：React + Vite 打底，文章用 Markdown 写，配色做了好几套随手换。
            没有后台、没有数据库，全是一堆躺在硬盘里的文件，改起来踏实。
          </p>
          <p>
            这里不追热点，也基本不掺水。写下来的多半是自己踩过的坑、和刚想明白的事，
            希望其中几句能替你省点时间。
          </p>
          <p className="about-sign">—— 杨帆，写于妙妙屋</p>
        </div>
      </section>

      <section className="section">
        <div className="home-section-head">
          <h2 className="home-section-title">
            <span className="home-section-no">02</span>最近在做
          </h2>
        </div>
        <ol className="about-doing-list">
          {doing.map((item) => (
            <li className="about-doing-item" key={item.title}>
              <span className="about-doing-mark" aria-hidden="true" />
              <p className="about-doing-title">{item.title}</p>
              <p className="about-doing-desc">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="home-section-head">
          <h2 className="home-section-title">
            <span className="home-section-no">03</span>技能
          </h2>
        </div>
        <ul className="about-skills">
          {skills.map((s) => (
            <li key={s} className="about-skill">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <div className="about-end" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
