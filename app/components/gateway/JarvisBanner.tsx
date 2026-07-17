import Link from "next/link";
import { jarvis } from "@/app/data/content";
import styles from "./gateway.module.css";

// Full-width feature banner rendered between the gateway intro and the
// concept-cards grid (GatewayPage.tsx). Distinct from the poll cards —
// dimmed RyuCo HQ screenshot backdrop, cyan-violet gradient hairline
// border — since Jarvis sits above the portfolio, not inside it.
export default function JarvisBanner() {
  return (
    <div className={styles.jarvisBanner}>
      <div className={styles.jarvisFrame}>
        <div
          className={styles.jarvisBackdrop}
          style={{ backgroundImage: "url(/images/jarvis/ryuco-hq.jpg)" }}
        />
        <div className={styles.jarvisOverlay} />
        <div className={styles.jarvisContent}>
          <span className={styles.jarvisEyebrow}>{jarvis.eyebrow}</span>
          <h2 className={styles.jarvisTitle}>{jarvis.title}</h2>
          <p className={styles.jarvisLine}>{jarvis.line}</p>
          <div className={styles.jarvisActions}>
            <a
              href={jarvis.hqUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.jarvisHqBtn}
            >
              Visit RYUCO HQ →
            </a>
            <Link href={jarvis.storyPath} className={styles.jarvisStoryBtn}>
              The story →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
