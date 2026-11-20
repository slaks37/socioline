import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import LearningCanvas from "../../../../components/LearningCanvas";
import {
  canvasPath,
  learningWeeks,
  weekSections,
} from "../../../../lib/learning-canvases";
import { meta } from "../../../../lib/seo";

type Props = { params: Promise<{ week: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return learningWeeks.map(({ week }) => ({ week: String(week) }));
}
function findWeek(value: string) {
  return (
    learningWeeks.find((item) => String(item.week) === value) ?? notFound()
  );
}
export async function generateMetadata({ params }: Props) {
  const w = findWeek((await params).week);
  return meta(
    `${canvasPath}/${w.week}`,
    `Canvas ${w.week} · ${w.title}`,
    w.target,
  );
}
export default async function CanvasWeek({ params }: Props) {
  const week = findWeek((await params).week);
  return (
    <article>
      <Link className="crumb" href={canvasPath}>
        <ChevronLeft size={15} /> Semua canvas
      </Link>
      <div className="workbook-heading">
        <span className="eyebrow">
          <i className="rule" /> {week.district} · Minggu {week.week} dari 12
        </span>
        <h1>{week.title}</h1>
        <p>{week.intro}</p>
        <dl className="workbook-outcome">
          <div>
            <dt>Target kemampuan</dt>
            <dd>{week.target}</dd>
          </div>
          <div>
            <dt>Hasil belajar</dt>
            <dd>{week.output}</dd>
          </div>
        </dl>
      </div>
      <LearningCanvas
        key={week.week}
        sheet={`minggu-${week.week}`}
        title={`Minggu ${week.week} · ${week.title}`}
        sections={weekSections(week)}
      />
      <p className="workbook-credit">
        Canvas dan rubrik oleh SocioLine. Rujukan minggu ini — {week.sources}.
        Perangkat belajar — {week.tools}.
      </p>
      <nav className="workbook-week-nav" aria-label="Minggu belajar">
        {week.week > 1 && (
          <Link href={`${canvasPath}/${week.week - 1}`}>
            <ArrowLeft size={16} /> Minggu {week.week - 1}
          </Link>
        )}
        <Link
          href={
            week.week === 12
              ? `${canvasPath}/perkembangan`
              : `${canvasPath}/${week.week + 1}`
          }
        >
          {week.week === 12 ? "Lembar perkembangan" : `Minggu ${week.week + 1}`}{" "}
          <ArrowRight size={16} />
        </Link>
      </nav>
    </article>
  );
}
