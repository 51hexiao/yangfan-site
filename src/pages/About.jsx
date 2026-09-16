import { usePageTitle } from "../utils/usePageTitle.js";
import { profile } from "../data/profile.js";

export default function About() {
  const { name, nicknameNote, tagline, bio, doing, skills, sign } = profile;
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
        <p className="page-subtitle">{tagline}</p>
      </header>

      <section className="about-id" aria-label="站点主人的名片">
        <div className="about-avatar">
          <img src={`${import.meta.env.BASE_URL}avatar.jpg`} alt={`${name}的头像`} />
        </div>
        <div className="about-id-text">
          <h2 className="about-name">{name}</h2>
          <p className="about-name-note">{nicknameNote}</p>
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
          {bio.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p className="about-sign">{sign}</p>
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
