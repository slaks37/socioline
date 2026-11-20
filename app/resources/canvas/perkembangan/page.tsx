import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LearningCanvas from "../../../../components/LearningCanvas";
import { canvasPath, trackerSections } from "../../../../lib/learning-canvases";
import { meta } from "../../../../lib/seo";

const title = "Catatan perkembangan W3";
const description =
  "Rangkum kemampuan awal dan akhir, bukti belajar, serta masukan mentor dari dua belas canvas mingguan.";
export const metadata = meta(`${canvasPath}/perkembangan`, title, description);

export default function LearningTracker() {
  return (
    <article>
      <Link className="crumb" href={canvasPath}>
        <ChevronLeft size={15} /> Semua canvas
      </Link>
      <div className="workbook-heading">
        <span className="eyebrow">
          <i className="rule" /> W3 Journey · Ringkasan 12 minggu
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <LearningCanvas
        sheet="perkembangan"
        title={title}
        sections={trackerSections()}
      />
    </article>
  );
}
