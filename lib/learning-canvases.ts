import weeks from "../content/learning-canvases.json";

export const canvasPath = "/resources/canvas";
export const learningWeeks = weeks;
export type LearningWeek = (typeof weeks)[number];
export type CanvasField = {
  key: string;
  label: string;
  type?: "text" | "date" | "score" | "evidence";
};
export type CanvasSection = {
  id: string;
  title: string;
  description?: string;
  fields: CanvasField[];
};

export const assessmentScale = [
  "Belum dapat menjelaskan atau melakukan",
  "Dapat mengerjakan dengan bantuan",
  "Dapat mempraktikkan secara mandiri",
  "Menunjukkan bukti, mengevaluasi, dan menyesuaikan penerapan",
];

export function weekSections(week: LearningWeek): CanvasSection[] {
  const prompts = [
    ["questions", "Cek pemahaman", week.questions],
    ["practice", "Tantangan praktik", week.practice],
    ["evidence", "Bukti & artefak", week.evidence],
    ["reflection", "Refleksi peserta", week.reflection],
  ] as const;
  return [
    {
      id: "profile",
      title: "Identitas lembar",
      description: "Isi sesuai kebutuhan belajar pribadi atau tim.",
      fields: [
        { key: "participant", label: "Peserta", type: "text" },
        { key: "team", label: "Tim", type: "text" },
        { key: "mentor", label: "Fasilitator", type: "text" },
        { key: "date", label: "Tanggal", type: "date" },
      ],
    },
    ...prompts.map(([id, title, items]) => ({
      id,
      title,
      fields: items.map((label, i) => ({ key: `${id}-${i + 1}`, label })),
    })),
    ...week.competencies.map((competency, index): CanvasSection => ({
      id: `skill-${index + 1}`,
      title: competency,
      fields: [
        { key: `skill-${index + 1}-before`, label: "Skor awal", type: "score" },
        { key: `skill-${index + 1}-after`, label: "Skor akhir", type: "score" },
        {
          key: `skill-${index + 1}-observation`,
          label: "Bukti atau observasi",
        },
      ],
    })),
    {
      id: "action",
      title: "Tindak lanjut",
      description: `Hasil belajar minggu ini adalah ${week.output}.`,
      fields: [
        {
          key: "next-action",
          label: "Aksi berikut, penanggung jawab, dan tanggal",
        },
      ],
    },
  ];
}

export function trackerSections(): CanvasSection[] {
  return [
    {
      id: "profile",
      title: "Identitas lembar",
      fields: [
        { key: "participant", label: "Peserta", type: "text" },
        { key: "cohort", label: "Kelompok belajar", type: "text" },
        { key: "mentor", label: "Mentor", type: "text" },
      ],
    },
    ...weeks.map((week): CanvasSection => ({
      id: `week-${week.week}`,
      title: `Minggu ${week.week} · ${week.title}`,
      description: week.output,
      fields: [
        { key: `week-${week.week}-before`, label: "Skor awal", type: "score" },
        { key: `week-${week.week}-after`, label: "Skor akhir", type: "score" },
        {
          key: `week-${week.week}-evidence`,
          label: "Bukti tersedia?",
          type: "evidence",
        },
        {
          key: `week-${week.week}-feedback`,
          label: "Umpan balik mentor atau fokus berikutnya",
        },
      ],
    })),
    {
      id: "review",
      title: "Ringkasan perkembangan",
      fields: [
        {
          key: "growth",
          label: "Perkembangan terbesar dan kekuatan yang terlihat",
        },
        {
          key: "support",
          label: "Keputusan dan kebutuhan dukungan berikutnya",
        },
      ],
    },
  ];
}
