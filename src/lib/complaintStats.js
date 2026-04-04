function normalizeStatus(status) {
  return (status || '').toString().trim().toLowerCase()
}

function isSolvedStatus(status) {
  const normalized = normalizeStatus(status)
  return normalized === 'solved' || normalized === 'resolved' || normalized === 'closed'
}

function isEscalatedStatus(status) {
  return normalizeStatus(status) === 'escalated'
}

export function summarizeComplaints(complaints = []) {
  const total = complaints.length
  const solved = complaints.filter((complaint) => isSolvedStatus(complaint.status)).length
  const escalated = complaints.filter((complaint) => isEscalatedStatus(complaint.status)).length
  const pending = Math.max(total - solved, 0)

  return {
    total,
    pending,
    solved,
    escalated,
  }
}
