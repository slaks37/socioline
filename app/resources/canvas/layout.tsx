import "./canvas.css";

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="learning-workbook wrap">{children}</div>;
}
