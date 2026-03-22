import { useScrollReveal } from '../hooks/useAnimations'
import ParticleBackground from '../components/ParticleBackground'
import './IKSPage.css'

const IKSPage = () => {
  useScrollReveal()

  return (
    <div className="iks-page">
      {/* ========== HERO ========== */}
      <section className="iks-hero">
        <div className="iks-hero-bg" />
        <ParticleBackground count={50} color="rgba(255,255,255,0.4)" />
        <div className="container iks-hero-content">
          <span className="iks-hero-badge">🕉️ Government of India Initiative</span>
          <h1>Indian Knowledge <span className="gradient-text">Systems</span></h1>
          <p>Preserving India's traditional knowledge across disciplines — an initiative by the Ministry of Education, Government of India, established in 2020 under AICTE.</p>
        </div>
      </section>

      {/* ========== QUICK STATS ========== */}
      <section className="iks-stats-section">
        <div className="container">
          <div className="iks-stats-row">
            {[
              { num: '8000+', label: 'Institutions Adopted', icon: '🏛️' },
              { num: '1.5L+', label: 'Books Digitized', icon: '📚' },
              { num: '1000+', label: 'Faculty Trained', icon: '👩‍🏫' },
              { num: '200+', label: 'Master Trainers', icon: '🎓' },
            ].map((s, i) => (
              <div key={i} className="iks-stat scroll-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <span className="iks-stat-icon">{s.icon}</span>
                <span className="iks-stat-num">{s.num}</span>
                <span className="iks-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHAT IS IKS ========== */}
      <section className="iks-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">📌 Understanding IKS</span>
            <h2 className="section-title">What is <span className="gradient-text">IKS</span>?</h2>
          </div>
          <div className="iks-intro-card glass-card scroll-reveal">
            <p className="iks-intro-quote">
              "Indian Knowledge System is a government initiative to integrate India's traditional knowledge with modern education for holistic and sustainable development."
            </p>
            <div className="iks-intro-body">
              <p>The Indian Knowledge System (IKS) is an initiative by the <strong>Ministry of Education, Government of India</strong>, aimed at promoting India's traditional knowledge across disciplines. Established in <strong>2020 under AICTE</strong>, it focuses on:</p>
              <ul className="iks-focus-list">
                <li><span className="iks-check">✓</span> Preservation of Indian heritage</li>
                <li><span className="iks-check">✓</span> Integration with modern education</li>
                <li><span className="iks-check">✓</span> Research and innovation based on traditional knowledge</li>
              </ul>
              <p className="iks-note">IKS represents knowledge developed through experience, observation, and experimentation over centuries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 3 PILLARS ========== */}
      <section className="iks-section iks-pillars-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">🏛️ Foundation</span>
            <h2 className="section-title">Three Pillars of <span className="gradient-text">IKS</span></h2>
          </div>
          <div className="iks-pillars stagger-children">
            {[
              { icon: '📖', title: 'Jnan', subtitle: 'Knowledge', desc: 'The pursuit and preservation of knowledge passed down through generations of scholars and practitioners.' },
              { icon: '🔬', title: 'Vignan', subtitle: 'Science', desc: 'Scientific methods and discoveries from ancient India, including mathematics, astronomy, and medicine.' },
              { icon: '🌿', title: 'Jeevan Darshan', subtitle: 'Way of Life', desc: 'Holistic philosophy that integrates ethics, sustainability, and well-being into everyday living.' },
            ].map((p, i) => (
              <div key={i} className="iks-pillar-card scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="pillar-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <span className="pillar-subtitle">{p.subtitle}</span>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CORE OBJECTIVES ========== */}
      <section className="iks-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">🎯 Government Vision</span>
            <h2 className="section-title">Core <span className="gradient-text">Objectives</span></h2>
          </div>
          <div className="iks-obj-grid stagger-children">
            {[
              { icon: '🏺', text: 'Promote Indian traditional knowledge systems' },
              { icon: '📘', text: 'Integrate IKS into modern education curriculum' },
              { icon: '🔗', text: 'Encourage interdisciplinary research' },
              { icon: '💡', text: 'Apply ancient knowledge to modern problems' },
              { icon: '🛡️', text: "Preserve India's cultural and intellectual heritage" },
              { icon: '🌏', text: 'Make education rooted in Indian culture yet globally relevant' },
            ].map((o, i) => (
              <div key={i} className="iks-obj-item scroll-reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
                <span className="iks-obj-icon">{o.icon}</span>
                <span className="iks-obj-text">{o.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEP 2020 ========== */}
      <section className="iks-section iks-nep-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">📜 National Education Policy</span>
            <h2 className="section-title">NEP 2020 & <span className="gradient-text">IKS</span></h2>
          </div>
          <div className="iks-nep-grid">
            <div className="iks-nep-main glass-card scroll-reveal">
              <h3>The NEP 2020 Backbone</h3>
              <p>The National Education Policy 2020 is the <strong>backbone of IKS implementation</strong>. It mandates that education should be rooted in Indian culture while being globally relevant.</p>
              <div className="iks-nep-highlights">
                <div className="nep-highlight">
                  <span className="nep-num">5%</span>
                  <span className="nep-label">Minimum academic credits from IKS subjects</span>
                </div>
                <div className="nep-highlight">
                  <span className="nep-num">50%</span>
                  <span className="nep-label">IKS content related to student's core discipline</span>
                </div>
              </div>
            </div>
            <div className="iks-nep-side">
              {[
                'IKS must be included in school and higher education',
                'Focus on holistic and multidisciplinary learning',
                'Integration of Yoga, Ayurveda, Indian philosophy, and traditional sciences',
                'Education rooted in Indian culture while globally relevant',
              ].map((item, i) => (
                <div key={i} className="nep-side-item scroll-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                  <span className="nep-side-num">0{i + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SUBJECTS / DOMAINS ========== */}
      <section className="iks-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">📚 Multi-Disciplinary</span>
            <h2 className="section-title">Domains Under <span className="gradient-text">IKS</span></h2>
          </div>
          <div className="iks-domains-grid stagger-children">
            {[
              { icon: '📚', cat: 'Academic Fields', items: ['Vedic Mathematics', 'Indian Astronomy', 'Sanskrit & Classical Languages', 'Philosophy & Ethics'] },
              { icon: '🧘', cat: 'Health & Lifestyle', items: ['Yoga', 'Ayurveda', 'Meditation', 'Wellness Practices'] },
              { icon: '🎨', cat: 'Culture & Arts', items: ['Music', 'Dance', 'Literature', 'Architecture'] },
              { icon: '🌱', cat: 'Science & Sustainability', items: ['Agriculture', 'Environmental Practices', 'Traditional Engineering', 'Water Management'] },
            ].map((d, i) => (
              <div key={i} className="iks-domain-card scroll-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="domain-header">
                  <span className="domain-icon">{d.icon}</span>
                  <h3>{d.cat}</h3>
                </div>
                <ul className="domain-list">
                  {d.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== GOVERNMENT INITIATIVES ========== */}
      <section className="iks-section iks-initiatives-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">🏛️ Official Programs</span>
            <h2 className="section-title">Government <span className="gradient-text">Initiatives</span></h2>
          </div>
          <div className="iks-initiatives-grid stagger-children">
            {[
              { icon: '🔹', title: 'IKS Division (AICTE)', desc: 'Central body managing IKS programs — promotes research and curriculum integration.' },
              { icon: '🔹', title: 'UGC Guidelines', desc: 'Recommend IKS courses in UG & PG programs with dedicated credit allocation.' },
              { icon: '🔹', title: 'Faculty Training Programs', desc: 'Mandatory FDPs — teachers trained in Indian philosophy, traditional sciences, and cultural knowledge.' },
              { icon: '🔹', title: 'Research Funding', desc: 'Projects funded in agriculture, architecture, music therapy, and traditional sciences.' },
              { icon: '🔹', title: 'IKS Cells & Centers', desc: 'Universities creating dedicated IKS research centers and coordination hubs.' },
              { icon: '🔹', title: 'Artist/Artisan-in-Residence', desc: 'Traditional artists & craftsmen invited into universities for hands-on cultural learning.' },
            ].map((init, i) => (
              <div key={i} className="iks-init-card scroll-reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="init-icon">{init.icon}</div>
                <h4>{init.title}</h4>
                <p>{init.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== LATEST UPDATES 2024-25 ========== */}
      <section className="iks-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">🆕 Latest Updates</span>
            <h2 className="section-title">2024–25 <span className="gradient-text">Developments</span></h2>
          </div>
          <div className="iks-timeline stagger-children">
            {[
              { title: 'Mandatory IKS Integration', desc: 'IKS now formally integrated into higher education curriculum. At least 5% of total academic credits from IKS subjects.' },
              { title: 'Expansion Plan', desc: 'Training 10,000 faculty and 1,000 research scholars across all institutions nationwide.' },
              { title: 'IKS Internship Programs', desc: 'Launched by AICTE — students and faculty can work on IKS-based projects and research.' },
              { title: '50+ Workshops', desc: 'IKS-TKDL workshops, faculty training programs, and knowledge dissemination sessions conducted.' },
              { title: 'Digital Repositories', desc: '1.5 lakh+ traditional books digitized with creation of knowledge databases for preservation.' },
              { title: 'Interdisciplinary Research', desc: 'IKS applied in engineering, science, agriculture, architecture, and management disciplines.' },
            ].map((item, i) => (
              <div key={i} className="iks-timeline-item scroll-reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRACTICAL USE (IKS AT GEHU) ========== */}
      <section className="iks-section iks-gehu-section">
        <div className="container">
          <div className="iks-section-header scroll-reveal">
            <span className="section-label">🎯 IKS at GEHU</span>
            <h2 className="section-title">How This Portal <span className="gradient-text">Helps</span></h2>
          </div>
          <div className="iks-gehu-grid">
            <div className="iks-events-card glass-card scroll-reveal">
              <h3>IKS Event Types</h3>
              <div className="iks-event-tags">
                {['Yoga Sessions', 'Sanskrit Workshops', 'Cultural Programs', 'Traditional Science Seminars', 'Awareness Programs', 'Heritage Walks', 'IKS Conferences'].map((e, i) => (
                  <span key={i} className="iks-event-tag">{e}</span>
                ))}
              </div>
            </div>
            <div className="iks-portal-features scroll-reveal">
              <h3>Portal Capabilities</h3>
              <div className="portal-feature-list">
                {[
                  { icon: '📋', text: 'Track IKS activities across campuses' },
                  { icon: '📝', text: 'Document events aligned with IKS guidelines' },
                  { icon: '📅', text: 'Organize and schedule IKS programs' },
                  { icon: '📊', text: 'Generate reports for AICTE compliance' },
                ].map((f, i) => (
                  <div key={i} className="portal-feature-item">
                    <span className="pf-icon">{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default IKSPage
