import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (prescription, doctorName, specialization) => {
  if (!prescription) return;

  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;

  // Colors
  const primaryColor = [2, 132, 199]; // text-sky-600
  const secondaryColor = [71, 85, 105]; // text-slate-600
  const lightGray = [241, 245, 249]; // bg-slate-100

  // 1. Header (Hospital / Clinic Name)
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PERSCRIPTO", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Digital Health Clinic", 140, 20);

  // 2. Doctor Info
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr. ${doctorName || 'Doctor'}`, 14, 45);
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${specialization || 'Specialist'}`, 14, 51);
  
  // Date and ID
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(prescription.createdAt || prescription.date || Date.now()).toLocaleDateString()}`, 140, 45);
  doc.text(`Prescription ID: ${prescription._id ? prescription._id.toString().substring(0, 8).toUpperCase() : 'RX-NEW'}`, 140, 51);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 58, 196, 58);

  // 3. Patient Info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Patient Information", 14, 68);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...secondaryColor);
  doc.text(`Name: ${prescription.patientName}`, 14, 76);
  doc.text(`Age: ${prescription.age || 'N/A'}`, 100, 76);
  doc.text(`Gender: ${prescription.gender || 'N/A'}`, 150, 76);

  // 4. Clinical Assessment
  let currentY = 88;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Clinical Assessment", 14, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...secondaryColor);
  if (prescription.symptoms) {
    doc.setFont("helvetica", "bold");
    doc.text("Symptoms:", 14, currentY);
    doc.setFont("helvetica", "normal");
    const symLines = doc.splitTextToSize(prescription.symptoms, 150);
    doc.text(symLines, 40, currentY);
    currentY += (symLines.length * 5) + 2;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Diagnosis:", 14, currentY);
  doc.setFont("helvetica", "normal");
  const diagLines = doc.splitTextToSize(prescription.diagnosis, 150);
  doc.text(diagLines, 40, currentY);
  currentY += (diagLines.length * 5) + 6;

  // 5. Rx Symbol
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Rx", 14, currentY);
  currentY += 6;

  // 6. Medicines Table
  const tableData = (prescription.medicines || []).map((m, i) => [
    i + 1,
    m.name,
    m.dosage,
    m.frequency,
    (m.time || []).join(", "),
    m.duration || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Time', 'Duration']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: lightGray },
    margin: { left: 14, right: 14 }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Check page break
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // 7. Lab Tests & Advice
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  
  if (prescription.labTests) {
    doc.text("Lab Tests & Investigations", 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    const labLines = doc.splitTextToSize(prescription.labTests, 180);
    doc.text(labLines, 14, currentY);
    currentY += (labLines.length * 5) + 8;
  }

  if (prescription.advice) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Advice & Instructions", 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    const advLines = doc.splitTextToSize(prescription.advice, 180);
    doc.text(advLines, 14, currentY);
    currentY += (advLines.length * 5) + 8;
  }

  if (prescription.followUpDate) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`, 14, currentY);
  }

  // 8. Footer (Sign)
  doc.setDrawColor(...primaryColor);
  doc.line(140, pageHeight - 30, 196, pageHeight - 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Doctor's Signature", 152, pageHeight - 24);

  // Save PDF
  doc.save(`Prescription_${prescription.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
