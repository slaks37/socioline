import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { canvasPath, learningWeeks } from "../../../lib/learning-canvases";
import { meta } from "../../../lib/seo";

const intro =
  "Pilih lembar untuk minggu belajarmu. Jawab pertanyaan awal, lakukan tantangan praktik, lalu bahas bukti dan refleksimu bersama mentor.";
export const metadata = meta(canvasPath, "Canvas belajar W3", intro);

export default function CanvasLibrary() {
  return (
    <article>
      <Link href="/resources" className="crumb">
        <ChevronLeft size={15} /> Pustaka
      </Link>
      <div className="workbook-heading">
        <span className="eyebrow">
          <i className="rule" /> W3 Discovery-to-Impact Journey
        </span>
        <h1>Canvas belajar W3</h1>
        <p>{intro}</p>
      </div>
      <div className="workbook-collections">
        {["The Word", "The World", "The Work"].map((district) => (
          <section className="workbook-collection" key={district}>
            <h2>{district}</h2>
            <ol
              start={learningWeeks.find((w) => w.district === district)?.week}
            >
              {learningWeeks
                .filter((w) => w.district === district)
                .map((week) => (
                  <li key={week.week}>
                    <Link prefetch={false} href={`${canvasPath}/${week.week}`}>
                      <span className="week-number">
                        {String(week.week).padStart(2, "0")}
                      </span>
                      <span>
                        <strong>{week.title}</strong>
                        <small>{week.output}</small>
                      </span>
                      <ArrowRight size={17} aria-hidden />
                    </Link>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
      <section className="workbook-review">
        <h2>Catatan perkembangan</h2>
        <p>
          Bandingkan kemampuan awal dan akhir di tiap minggu. Catat bukti,
          masukan mentor, dan dukungan yang kamu butuhkan.
        </p>
        <Link className="button dark" href={`${canvasPath}/perkembangan`}>
          Buka lembar perkembangan <ArrowRight size={16} />
        </Link>
      </section>
      <details className="workbook-guide">
        <summary>Panduan fasilitator</summary>
        <ol>
          <li>
            Awali dengan 10 menit untuk cek pemahaman dan penilaian kemampuan
            awal.
          </li>
          <li>
            Sediakan 45–70 menit untuk tantangan praktik dan pengumpulan bukti.
            Gunakan simulasi jika kegiatan lapangan belum mendapat izin.
          </li>
          <li>
            Berikan 15 menit untuk refleksi, skor akhir, dan bukti yang
            mendasari penilaian. Angka mengukur kemampuan yang ditunjukkan.
            Pengalaman iman dan nilai pribadi berada di luar penilaian ini.
          </li>
          <li>
            Akhiri dengan 10 menit untuk meninjau artefak bersama. Catat dua
            kekuatan, satu kebutuhan belajar, serta langkah berikutnya.
            Perhatikan juga suara komunitas dan perbedaan pendapat.
          </li>
        </ol>
      </details>
      <p className="workbook-credit">
        Canvas dan rubrik oleh SocioLine. Sumber konsep meliputi Xplore,
        Perspectives, Design a Better Business, dan Value Proposition Design.
      </p>
    </article>
  );
}
