import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileText, Eye, Loader2, CheckCircle2, X, ChevronLeft, ChevronRight, Key, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface StudentRecord {
  recipientName: string;
  degree: string;
  institution: string;
  gpa?: string;
  certificateId?: string;
  authCode?: string;
  issueDate?: string;
  minted?: boolean;
}

const SAMPLE_CSV = `recipientName,degree,institution,gpa
Alex Johnson,B.Tech Computer Science,MIT University,3.87
Sarah Williams,M.Sc Data Science,Stanford University,3.92
James Chen,B.A Economics,Harvard University,3.75`;

const CertificateGenerator = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState(0);
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
      return {
        recipientName: cols[nameIdx] || "",
        degree: cols[degreeIdx] || "",
        institution: cols[instIdx] || "",
        gpa: gpaIdx !== -1 ? cols[gpaIdx] : undefined,
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
      toast({ title: `${parsed.length} students loaded`, description: "Ready to mint certificates" });
    };
    reader.readAsText(file);
  };

  // Mint all certificates via edge function
  const handleMintAll = async () => {
    if (students.length === 0) return;
    setMinting(true);
    setMintProgress(0);

    const updated = [...students];
    let successCount = 0;

    for (let i = 0; i < updated.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('mint-certificate', {
          body: {
            recipientName: updated[i].recipientName,
            degree: updated[i].degree,
            institution: updated[i].institution,
            gpa: updated[i].gpa,
          },
        });
        if (error) throw error;
        if (data.success) {
          updated[i] = {
            ...updated[i],
            certificateId: data.certificate.certificateId,
            authCode: data.certificate.authCode,
            minted: true,
          };
          successCount++;
        }
      } catch (e) {
        console.error(`Mint failed for ${updated[i].recipientName}:`, e);
      }
      setMintProgress(((i + 1) / updated.length) * 100);
    }

    setStudents(updated);
    setMinting(false);
    toast({
      title: `${successCount}/${updated.length} Certificates Minted`,
      description: "Auth codes generated for each student",
    });
  };

  const drawCertificate = async (ctx: CanvasRenderingContext2D, student: StudentRecord, width: number, height: number) => {
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

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin + 12, margin + 12, width - (margin + 12) * 2, height - (margin + 12) * 2);

    // Corner decorations
    const cornerSize = 30;
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(margin, margin + cornerSize); ctx.lineTo(margin, margin); ctx.lineTo(margin + cornerSize, margin); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - margin - cornerSize, margin); ctx.lineTo(width - margin, margin); ctx.lineTo(width - margin, margin + cornerSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(margin, height - margin - cornerSize); ctx.lineTo(margin, height - margin); ctx.lineTo(margin + cornerSize, height - margin); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - margin - cornerSize, height - margin); ctx.lineTo(width - margin, height - margin); ctx.lineTo(width - margin, height - margin - cornerSize); ctx.stroke();

    // Shield icon
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

    // Title
    ctx.fillStyle = "#2563EB";
    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
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

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 28px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", cx, 220);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText("This is to certify that", cx, 260);

    ctx.fillStyle = "#2563EB";
    ctx.font = "700 36px 'Inter', sans-serif";
    ctx.fillText(student.recipientName, cx, 305);

    const nameWidth = ctx.measureText(student.recipientName).width;
    const underGrad = ctx.createLinearGradient(cx - nameWidth / 2, 0, cx + nameWidth / 2, 0);
    underGrad.addColorStop(0, "transparent");
    underGrad.addColorStop(0.2, "rgba(37,99,235,0.4)");
    underGrad.addColorStop(0.8, "rgba(124,58,237,0.4)");
    underGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = underGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - nameWidth / 2 - 20, 315); ctx.lineTo(cx + nameWidth / 2 + 20, 315); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText("has successfully completed the requirements for", cx, 348);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 22px 'Inter', sans-serif";
    ctx.fillText(student.degree, cx, 385);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px 'Inter', sans-serif";
    ctx.fillText(`from ${student.institution}`, cx, 418);

    if (student.gpa) {
      ctx.fillStyle = "rgba(37,99,235,0.8)";
      ctx.font = "500 13px 'Inter', sans-serif";
      ctx.fillText(`Cumulative GPA: ${student.gpa}`, cx, 448);
    }

    // QR Code - if certificate has been minted
    if (student.certificateId) {
      try {
        const qrDataUrl = await QRCode.toDataURL(`proofvault://verify/${student.certificateId}`, {
          width: 100,
          margin: 1,
          color: { dark: '#2563EB', light: '#00000000' },
        });
        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => resolve();
          qrImg.src = qrDataUrl;
        });
        // Draw QR in bottom-right area
        const qrSize = 80;
        const qrX = width - margin - qrSize - 30;
        const qrY = height - margin - qrSize - 30;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "400 8px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Scan to Verify", qrX + qrSize / 2, qrY + qrSize + 12);
      } catch (e) {
        console.error('QR generation error:', e);
      }
    }

    // Bottom info boxes
    const boxY = height - 130;
    const boxW = 180;
    const boxH = 55;
    const boxes = [
      { label: "CERTIFICATE ID", value: student.certificateId || "—" },
      { label: "ISSUE DATE", value: student.issueDate || "—" },
      { label: "STATUS", value: student.minted ? "VERIFIED ✓" : "PENDING" },
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
      ctx.fillStyle = i === 2 ? (student.minted ? "#22C55E" : "#F59E0B") : "#2563EB";
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillText(box.value, bx + boxW / 2, boxY + 40);
    });

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "400 9px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Blockchain Secured  •  Polygon PoS  •  IPFS Stored", cx, height - 55);
  };

  const renderPreview = async (student: StudentRecord) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = 800;
    const h = 566;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await drawCertificate(ctx, student, w, h);
  };

  const generatePDFs = async () => {
    if (students.length === 0) return;
    const mintedStudents = students.filter(s => s.minted);
    if (mintedStudents.length === 0) {
      toast({ title: "No minted certificates", description: "Mint certificates first before generating PDFs", variant: "destructive" });
      return;
    }
    setGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      const w = 1600;
      const h = 1132;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [w, h] });
      for (let i = 0; i < mintedStudents.length; i++) {
        if (i > 0) pdf.addPage([w, h], "landscape");
        await drawCertificate(ctx, mintedStudents[i], w, h);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, w, h);
      }
      pdf.save("ProofVault_Certificates.pdf");
      toast({ title: "PDFs Generated!", description: `${mintedStudents.length} certificate(s) saved` });
    } catch (e) {
      console.error(e);
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const currentStudent = students[previewIndex];
  if (showPreview && currentStudent) {
    setTimeout(() => renderPreview(currentStudent), 50);
  }

  const hasMinted = students.some(s => s.minted);
  const allMinted = students.length > 0 && students.every(s => s.minted);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-surface-elevated p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight-secondary flex items-center justify-center shadow-lg shadow-highlight/15">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Issue Certificates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Upload CSV → Mint on blockchain → Generate PDFs with QR</p>
          </div>
        </div>

        <div className="divider-gradient mb-6" />

        {/* CSV Upload */}
        <div onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-highlight/30 transition-all duration-300 group">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-highlight transition-colors" />
          <p className="text-sm font-medium text-foreground/80">{fileName || "Click to upload CSV file"}</p>
          <p className="text-xs text-muted-foreground mt-1">Required columns: name, degree, institution (optional: gpa)</p>
        </div>

        <div className="mt-4">
          <button onClick={() => {
            const parsed = parseCSV(SAMPLE_CSV);
            setStudents(parsed);
            setFileName("sample.csv");
            setPreviewIndex(0);
            toast({ title: `${parsed.length} sample students loaded` });
          }} className="text-xs text-highlight/70 hover:text-highlight transition-colors">
            Or load sample data →
          </button>
        </div>

        {/* Loaded students */}
        {students.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/8 border border-success/15">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-success">{students.length} student(s)</span>
                <span className="text-muted-foreground"> loaded
                  {hasMinted && ` • ${students.filter(s => s.minted).length} minted`}
                </span>
              </p>
            </div>

            {/* Student list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {students.map((s, i) => (
                <div key={i} className="data-cell flex items-center justify-between py-2.5 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{s.recipientName}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {s.degree}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.minted && s.authCode && (
                      <button onClick={() => copyToClipboard(s.authCode!, "Auth Code")}
                        className="flex items-center gap-1 text-[10px] font-mono text-warning/80 hover:text-warning transition-colors">
                        <Key className="w-3 h-3" />
                        {s.authCode}
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <span className={`text-[10px] font-mono ${s.minted ? 'text-success' : 'text-muted-foreground'}`}>
                      {s.minted ? s.certificateId : 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!allMinted && (
                <button onClick={handleMintAll} disabled={minting}
                  className="flex-1 py-3 btn-primary flex items-center justify-center gap-2">
                  {minting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Minting... {Math.round(mintProgress)}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Mint All on Polygon
                    </>
                  )}
                </button>
              )}
              <button onClick={() => { setShowPreview(true); setPreviewIndex(0); }}
                className="flex-1 py-3 btn-ghost flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </button>
              {hasMinted && (
                <button onClick={generatePDFs} disabled={generating}
                  className="flex-1 py-3 btn-primary flex items-center justify-center gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {generating ? "Generating..." : "Download PDFs"}
                </button>
              )}
            </div>

            {minting && (
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-highlight to-highlight-secondary"
                  animate={{ width: `${mintProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
            )}

            <button onClick={() => { setStudents([]); setFileName(""); setShowPreview(false); }}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2">
              Clear data
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && currentStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-surface-elevated p-4 max-w-4xl w-full space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold">
                  Certificate Preview ({previewIndex + 1} / {students.length})
                </h4>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <canvas ref={canvasRef} className="w-full rounded-lg border border-border/40" style={{ aspectRatio: "800/566" }} />

              {students.length > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => { setPreviewIndex(Math.max(0, previewIndex - 1)); }}
                    disabled={previewIndex === 0} className="p-2 rounded-lg btn-ghost disabled:opacity-30">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-mono text-muted-foreground">{previewIndex + 1} / {students.length}</span>
                  <button onClick={() => { setPreviewIndex(Math.min(students.length - 1, previewIndex + 1)); }}
                    disabled={previewIndex === students.length - 1} className="p-2 rounded-lg btn-ghost disabled:opacity-30">
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
