import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedProjectBySlug } from "@/lib/projects";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { ProjectGallery } from "@/components/project-gallery";
import styles from "./project.module.css";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} | VIC Premier Construction Team`,
    description: project.summary || `Selected project by VIC Premier Construction Team.`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) notFound();

  return (
    <main className={styles.page} id="main-content">
      <PublicHeader />

      <section className={styles.intro}>
        <p className={styles.eyebrow}>VIC PREMIER / PROJECT</p>
        <h1>{project.title}</h1>
        {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}
      </section>

      {project.project_media.length > 0 ? (
        <ProjectGallery projectTitle={project.title} media={project.project_media} />
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

      <PublicFooter />
    </main>
  );
}
