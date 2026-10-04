import { notFound } from "next/navigation";
import { getPublishedProjectBySlug, projectMediaUrl } from "@/lib/projects";
import styles from "./project.module.css";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/#projects" className={styles.back}>← Selected work</a>
        <a href="/#consultation" className={styles.quote}>Request a free quote ↗</a>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>VIC PREMIER / PROJECT</p>
        <h1>{project.title}</h1>
        {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}
      </section>

      {project.project_media.length > 0 ? (
        <section className={styles.gallery} aria-label={`${project.title} project media`}>
          {project.project_media.map((media, index) => (
            <figure
              className={`${styles.media} ${index === 0 ? styles.lead : ""}`}
              key={media.id}
            >
              {media.media_type === "image" ? (
                <img src={projectMediaUrl(media)} alt={media.alt_text || project.title} loading={index === 0 ? "eager" : "lazy"} />
              ) : (
                <video src={projectMediaUrl(media)} controls playsInline preload="metadata" />
              )}
              {media.caption ? <figcaption>{media.caption}</figcaption> : null}
            </figure>
          ))}
        </section>
      ) : null}

      {project.description ? (
        <section className={styles.description}>
          <p className={styles.eyebrow}>PROJECT NOTES</p>
          <p>{project.description}</p>
        </section>
      ) : null}

      <section className={styles.cta}>
        <p className={styles.eyebrow}>START A PROJECT</p>
        <h2>Planning work on your property?</h2>
        <p>Share the scope of work and the next practical step can be arranged.</p>
        <div className={styles.actions}>
          <a href="tel:+61411786573">Call 0411 786 573 ↗</a>
          <a href="mailto:vicpremier_constructionteam@yahoo.com">Email VIC Premier ↗</a>
        </div>
      </section>
    </main>
  );
}
