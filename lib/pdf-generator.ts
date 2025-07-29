import jsPDF from "jspdf"

interface PullRequest {
    id: number
    title: string
    state: string
    created_on: string
    merged_on?: string
    comments: number
    commits: number
    link: string
    target_branch?: string
    source_branch?: string
    days_to_merge?: number
    merged_by?: string
  }
  

interface ReportData {
  employee: string
  dateRange: string
  repositories: string[]
  prs: PullRequest[]
  summary: {
    totalPRs: number
    totalComments: number
    totalCommits: number
    mergedPRs: number
    openPRs: number
    declinedPRs: number
    avgDaysToMerge: number
  }
}

interface Summary {
    totalPRs: number
    totalComments: number
    totalCommits: number
    mergedPRs: number
    openPRs: number
    declinedPRs: number
    avgDaysToMerge: number
  }
  

export async function generatePDFReport(data: ReportData, chartsElement: HTMLElement | null) {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
  }

  // Cover Page
  pdf.setFontSize(24)
  pdf.setFont("helvetica", "bold")
  pdf.text("Employee Evaluation Report", pageWidth / 2, 40, { align: "center" })

  pdf.setFontSize(16)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Employee: ${data.employee}`, pageWidth / 2, 60, { align: "center" })
  pdf.text(`Period: ${data.dateRange}`, pageWidth / 2, 75, { align: "center" })
  pdf.text(`Repositories: ${data.repositories.join(", ")}`, pageWidth / 2, 90, { align: "center" })

  const currentDate = new Date().toLocaleDateString()
  pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 105, { align: "center" })

  // Add company branding
  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  pdf.text("PR Dashboard - Performance Analytics", pageWidth / 2, pageHeight - 20, { align: "center" })

  // New page for Executive Summary
  pdf.addPage()
  yPosition = 20

  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 0, 0)
  pdf.text("Executive Summary", 20, yPosition)
  yPosition += 15

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const summaryText = `This report analyzes ${data.employee}'s pull request activity from ${data.dateRange}. 
During this period, ${data.employee} contributed ${data.summary.totalPRs} pull requests across ${data.repositories.length} repositories, 
with ${data.summary.mergedPRs} successfully merged PRs (${((data.summary.mergedPRs / data.summary.totalPRs) * 100).toFixed(1)}% merge rate). 
The average time to merge was ${data.summary.avgDaysToMerge.toFixed(1)} days, indicating ${data.summary.avgDaysToMerge < 3 ? "efficient" : "moderate"} development velocity.`

  const splitText = pdf.splitTextToSize(summaryText, pageWidth - 40)
  pdf.text(splitText, 20, yPosition)
  yPosition += splitText.length * 5 + 10

  // Performance Metrics Summary
  checkPageBreak(60)
  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("Key Performance Metrics", 20, yPosition)
  yPosition += 15

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")

  const metrics = [
    `Total Pull Requests: ${data.summary.totalPRs}`,
    `Merged PRs: ${data.summary.mergedPRs} (${((data.summary.mergedPRs / data.summary.totalPRs) * 100).toFixed(1)}%)`,
    `Open PRs: ${data.summary.openPRs}`,
    `Declined PRs: ${data.summary.declinedPRs}`,
    `Total Commits: ${data.summary.totalCommits}`,
    `Total Comments: ${data.summary.totalComments}`,
    `Average Days to Merge: ${data.summary.avgDaysToMerge.toFixed(1)} days`,
  ]

  metrics.forEach((metric) => {
    pdf.text(`• ${metric}`, 25, yPosition)
    yPosition += 7
  })

  // Add charts if available
  if (chartsElement) {
    try {
      const charts = chartsElement.querySelectorAll("canvas")

      for (let i = 0; i < charts.length; i++) {
        const canvas = charts[i]
        if (canvas) {
          checkPageBreak(80)

          const chartImage = canvas.toDataURL("image/png")
          const imgWidth = 150
          const imgHeight = 100

          pdf.addImage(chartImage, "PNG", (pageWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 15
        }
      }
    } catch (error) {
      console.error("Error adding charts to PDF:", error)
    }
  }

  // Employee Evaluation Section
  pdf.addPage()
  yPosition = 20

  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text("Employee Evaluation", 20, yPosition)
  yPosition += 20

  // PR Quality Assessment
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("PR Quality Assessment", 20, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const mergeRate = (data.summary.mergedPRs / data.summary.totalPRs) * 100
  const commentsPerPR = data.summary.totalComments / data.summary.totalPRs

  const qualityText = `Merge Rate: ${mergeRate.toFixed(1)}% - ${mergeRate > 80 ? "Excellent" : mergeRate > 60 ? "Good" : "Needs Improvement"}
Comments per PR: ${commentsPerPR.toFixed(1)} - ${commentsPerPR < 2 ? "Low engagement" : commentsPerPR < 5 ? "Good collaboration" : "High engagement"}`

  const qualitySplit = pdf.splitTextToSize(qualityText, pageWidth - 40)
  pdf.text(qualitySplit, 20, yPosition)
  yPosition += qualitySplit.length * 5 + 10

  // Speed Assessment
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("Development Speed", 20, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const speedAssessment =
    data.summary.avgDaysToMerge < 2
      ? "Very Fast"
      : data.summary.avgDaysToMerge < 5
        ? "Fast"
        : data.summary.avgDaysToMerge < 10
          ? "Moderate"
          : "Slow"

  pdf.text(`Average Days to Merge: ${data.summary.avgDaysToMerge.toFixed(1)} days - ${speedAssessment}`, 20, yPosition)
  yPosition += 15

  // Overall Score
  const score = calculateOverallScore(data.summary)
  pdf.setFontSize(15)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(0, 150, 0)
  pdf.text(`Overall Score: ${score}/10 - ${getScoreLabel(score)}`, 16, yPosition)
  yPosition += 20

  // Suggestions for Improvement
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("Suggestions for Improvement", 20, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  const suggestions = generateSuggestions(data.summary)
  suggestions.forEach((suggestion) => {
    checkPageBreak(10)
    pdf.text(`• ${suggestion}`, 25, yPosition)
    yPosition += 7
  })

  // PR Details Table
  pdf.addPage()
  yPosition = 20

  pdf.setFontSize(16)
  pdf.setFont("helvetica", "bold")
  pdf.text("Detailed PR List", 20, yPosition)
  yPosition += 15

  // Table headers
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  const headers = ["Title", "State", "Commits", "Comments", "Days to Merge"]
  const colWidths = [80, 25, 20, 25, 30]
  let xPos = 20

  headers.forEach((header, index) => {
    pdf.text(header, xPos, yPosition)
    xPos += colWidths[index]
  })
  yPosition += 8

  // Table rows
  pdf.setFont("helvetica", "normal")
  data.prs.slice(0, 20).forEach((pr) => {
    checkPageBreak(8)
    xPos = 20

    const rowData = [
      pr.title.substring(0, 30) + (pr.title.length > 30 ? "..." : ""),
      pr.state,
      pr.commits.toString(),
      pr.comments.toString(),
      pr.days_to_merge?.toString() || "—",
    ]

    rowData.forEach((data, index) => {
      pdf.text(data, xPos, yPosition)
      xPos += colWidths[index]
    })
    yPosition += 6
  })

  // Save the PDF
  const fileName = `${data.employee}_Evaluation_Report_${new Date().toISOString().split("T")[0]}.pdf`
  pdf.save(fileName)
}

function calculateOverallScore(summary: Summary): number {
  const mergeRate = (summary.mergedPRs / summary.totalPRs) * 100
  const speedScore =
    summary.avgDaysToMerge < 2 ? 10 : summary.avgDaysToMerge < 5 ? 8 : summary.avgDaysToMerge < 10 ? 6 : 4

  const qualityScore = mergeRate > 80 ? 10 : mergeRate > 60 ? 8 : 6
  const activityScore = summary.totalPRs > 20 ? 10 : summary.totalPRs > 10 ? 8 : 6

  return Math.round(((speedScore + qualityScore + activityScore) / 3) * 10) / 10
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "Outstanding Contributor!"
  if (score >= 8) return "Strong Contributor!"
  if (score >= 7) return "Good Contributor"
  if (score >= 6) return "Satisfactory Performance"
  return "Needs Improvement"
}

function generateSuggestions(summary: Summary): string[] {
  const suggestions = []

  const mergeRate = (summary.mergedPRs / summary.totalPRs) * 100
  if (mergeRate < 70) {
    suggestions.push("Focus on improving PR quality to increase merge rate")
  }

  if (summary.avgDaysToMerge > 7) {
    suggestions.push("Work on reducing PR size for faster review cycles")
  }

  if (summary.totalComments / summary.totalPRs < 2) {
    suggestions.push("Engage more in code reviews and discussions")
  }

  if (summary.openPRs > 5) {
    suggestions.push("Reduce open PR backlog by focusing on completion")
  }

  if (suggestions.length === 0) {
    suggestions.push("Continue maintaining excellent performance standards")
    suggestions.push("Consider mentoring junior developers")
  }

  return suggestions
}
