import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileText, Eye, Loader2, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface StudentRecord {
  recipientName: string;
  degree: string;
  institution: string;
  gpa?: string;
  certificateId?: string;
  issueDate?: string;
}

const SAMPLE_CSV = `recipientName,degree,institution,gpa
Alex Johnson,B.Tech Computer Science,MIT University,3.87
Sarah Williams,M.Sc Data Science,Stanford University,3.92
James Chen,B.A Economics,Harvard University,3.75`;

const CertificateGenerator = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parseCSV = (text: string): StudentRecord[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name") || h === "recipientname");
    const degreeIdx = headers.findIndex((h) => h.includes("degree") || h.includes("program"));
    const instIdx = headers.findIndex((h) => h.includes("institution") || h.includes("university") || h.includes("college"));
    const gpaIdx = headers.findIndex((h) => h.includes("gpa") || h.includes("grade"));

    if (nameIdx === -1 || degreeIdx === -1 || instIdx === -1) return [];

    return lines.slice(1).filter(l => l.trim()).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const year = new Date().getFullYear();
      const id = `PV-${year}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
      return {
        recipientName: cols[nameIdx] || "",
        degree: cols[degreeIdx] || "",
        institution: cols[instIdx] || "",
        gpa: gpaIdx !== -1 ? cols[gpaIdx] : undefined,
        certificateId: id,
        issueDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      };
    }).filter(s => s.recipientName && s.degree && s.institution);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a CSV file", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast({ title: "Parse error", description: "Could not find required columns: name, degree, institution", variant: "destructive" });
        return;
      }
      setStudents(parsed);
      setPreviewIndex(0);
      toast({ title: `${parsed.length} students loaded`, description: "Ready to generate certificates" });
    };
    reader.readAsText(file);
  };

  const drawCertificate = (ctx: CanvasRenderingContext2D, student: StudentRecord, width: number, height: number) => {
    // Background
    ctx.fillStyle = "#0F1420";
    ctx.fillRect(0, 0, width, height);

    // Inner frame with gradient border
    const margin = 40;
    const gradient = ctx.createLinearGradient(margin, margin, width - margin, height - margin);
    gradient.addColorStop(0, "#2563EB");
    gradient.addColorStop(1, "#7C3AED");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Inner subtle border
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);

    // Corner decorations
    const cornerSize = 30;
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath(); ctx.moveTo(margin, margin + cornerSize); ctx.lineTo(margin, margin); ctx.lineTo(margin + cornerSize, margin); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(width - margin - cornerSize, margin); ctx.lineTo(width - margin, margin); ctx.lineTo(width - margin, margin + cornerSize); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(margin, height - margin - cornerSize); ctx.lineTo(margin, height - margin); ctx.lineTo(margin + cornerSize, height - margin); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(width - margin - cornerSize, height - margin); ctx.lineTo(width - margin, height - margin); ctx.lineTo(width - margin, height - margin - cornerSize); ctx.stroke();

    // Shield icon at top
    const cx = width / 2;
    ctx.save();
    ctx.translate(cx, 110);
    ctx.fillStyle = "#2563EB";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(-22, -28, -28, -18, -28, -8);
    ctx.bezierCurveTo(-28, 12, -10, 26, 0, 32);
    ctx.bezierCurveTo(10, 26, 28, 12, 28, -8);
    ctx.bezierCurveTo(28, -18, 22, -28, 0, -28);
    ctx.fill();
    // Checkmark in shield
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-2, 10);
    ctx.lineTo(10, -6);
    ctx.stroke();
    ctx.restore();

    // "PROOF VAULT" title
    ctx.fillStyle = "#2563EB";
    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillText("P R O O F   V A U L T", cx, 165);

    // Divider
    const divGrad = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.3, "#2563EB");
    divGrad.addColorStop(0.7, "#7C3AED");
    divGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 120, 180); ctx.lineTo(cx + 120, 180); ctx.stroke();

    // "CERTIFICATE OF ACHIEVEMENT"
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 28px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", cx, 220);

    // "This is to certify that"
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText("This is to certify that", cx, 260);

    // Recipient name
    ctx.fillStyle = "#2563EB";
    ctx.font = "700 36px 'Inter', sans-serif";
    ctx.fillText(student.recipientName, cx, 305);

    // Underline under name
    const nameWidth = ctx.measureText(student.recipientName).width;
    const underGrad = ctx.createLinearGradient(cx - nameWidth / 2, 0, cx + nameWidth / 2, 0);
    underGrad.addColorStop(0, "transparent");
    underGrad.addColorStop(0.2, "rgba(37,99,235,0.4)");
    underGrad.addColorStop(0.8, "rgba(124,58,237,0.4)");
    underGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = underGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - nameWidth / 2 - 20, 315); ctx.lineTo(cx + nameWidth / 2 + 20, 315); ctx.stroke();

    // "has successfully completed"
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText("has successfully completed the requirements for", cx, 348);

    // Degree
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 22px 'Inter', sans-serif";
    ctx.fillText(student.degree, cx, 385);

    // Institution
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText(`from ${student.institution}`, cx, 418);

    // GPA if present
    if (student.gpa) {
      ctx.fillStyle = "rgba(37,99,235,0.8)";
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillText(`Cumulative GPA: ${student.gpa}`, cx, 448);
    }

    // Bottom info boxes
    const boxY = height - 130;
    const boxW = 180;
    const boxH = 55;
    const boxes = [
      { label: "CERTIFICATE ID", value: student.certificateId || "—" },
      { label: "ISSUE DATE", value: student.issueDate || "—" },
      { label: "STATUS", value: "VERIFIED ✓" },
    ];

    boxes.forEach((box, i) => {
      const bx = cx - (boxes.length * boxW + (boxes.length - 1) * 16) / 2 + i * (boxW + 16);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "600 9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(box.label, bx + boxW / 2, boxY + 20);
      ctx.fillStyle = i === 2 ? "#22C55E" : "#2563EB";
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillText(box.value, bx + boxW / 2, boxY + 40);
    });

    // Bottom text
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "400 9px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Blockchain Secured  •  Polygon PoS  •  IPFS Stored", cx, height - 55);
  };

  const renderPreview = (student: StudentRecord) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = 800;
    const h = 566;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCertificate(ctx, student, w, h);
  };

  const generatePDFs = async () => {
    if (students.length === 0) return;
    setGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      const w = 1600;
      const h = 1132;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      if (students.length === 1) {
        // Single PDF
        drawCertificate(ctx, students[0], w, h);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [w, h] });
        pdf.addImage(imgData, "JPEG", 0, 0, w, h);
        pdf.save(`${students[0].recipientName.replace(/\s+/g, "_")}_Certificate.pdf`);
      } else {
        // Multi-page PDF
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [w, h] });
        for (let i = 0; i < students.length; i++) {
          if (i > 0) pdf.addPage([w, h], "landscape");
          drawCertificate(ctx, students[i], w, h);
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, w, h);
        }
        pdf.save("ProofVault_Certificates.pdf");
      }

      toast({ title: "Certificates Generated!", description: `${students.length} certificate(s) saved as PDF` });
    } catch (e) {
      console.error(e);
      toast({ title: "Generation failed", description: "Could not generate PDFs", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Render preview when preview index or students change
  const currentStudent = students[previewIndex];
  if (showPreview && currentStudent) {
    setTimeout(() => renderPreview(currentStudent), 50);
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-surface-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Generate Certificates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Upload CSV with student data to generate PDF certificates</p>
          </div>
        </div>

        <div className="divider-gradient mb-6" />

        {/* CSV Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-highlight/30 transition-all duration-300 group"
        >
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-highlight transition-colors" />
          <p className="text-sm font-medium text-foreground/80">
            {fileName ? fileName : "Click to upload CSV file"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: name, degree, institution (optional: gpa)
          </p>
        </div>

        {/* Sample CSV */}
        <div className="mt-4">
          <button
            onClick={() => {
              const parsed = parseCSV(SAMPLE_CSV);
              setStudents(parsed);
              setFileName("sample.csv");
              setPreviewIndex(0);
              toast({ title: `${parsed.length} sample students loaded` });
            }}
            className="text-xs text-highlight/70 hover:text-highlight transition-colors"
          >
            Or load sample data →
          </button>
        </div>

        {/* Loaded students info */}
        {students.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/8 border border-success/15">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-success">{students.length} student(s)</span>
                <span className="text-muted-foreground"> ready for certificate generation</span>
              </p>
            </div>

            {/* Student list preview */}
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {students.map((s, i) => (
                <div key={i} className="data-cell flex items-center justify-between py-2.5 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{s.recipientName}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {s.degree}</span>
                  </div>
                  <span className="text-[10px] font-mono text-highlight/60">{s.certificateId}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPreview(true); setPreviewIndex(0); }}
                className="flex-1 py-3 btn-ghost flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={generatePDFs}
                disabled={generating}
                className="flex-1 py-3 btn-primary flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? "Generating..." : "Download PDF"}
              </button>
            </div>

            <button
              onClick={() => { setStudents([]); setFileName(""); setShowPreview(false); }}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2"
            >
              Clear data
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && currentStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-surface-elevated p-4 max-w-4xl w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold">
                  Certificate Preview ({previewIndex + 1} / {students.length})
                </h4>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <canvas
                ref={canvasRef}
                className="w-full rounded-lg border border-border/40"
                style={{ aspectRatio: "800/566" }}
              />

              {students.length > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => { const ni = Math.max(0, previewIndex - 1); setPreviewIndex(ni); }}
                    disabled={previewIndex === 0}
                    className="p-2 rounded-lg btn-ghost disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-muted-foreground font-mono">
                    {currentStudent.recipientName}
                  </span>
                  <button
                    onClick={() => { const ni = Math.min(students.length - 1, previewIndex + 1); setPreviewIndex(ni); }}
                    disabled={previewIndex === students.length - 1}
                    className="p-2 rounded-lg btn-ghost disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificateGenerator;
