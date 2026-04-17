export async function exportDashboardPDF(elementId: string, filename = 'finpath-report.pdf') {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')
  const el = document.getElementById(elementId)
  if (!el) return
  const canvas = await html2canvas(el, { scale: 1.5, useCORS: true })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = (canvas.height * pageWidth) / canvas.width
  pdf.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight)
  pdf.save(filename)
}
