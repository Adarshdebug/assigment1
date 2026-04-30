const developers = [
  { id: "dev-101", name: "Aarav Mehta", team: "Platform" },
  { id: "dev-102", name: "Maya Rao", team: "Frontend" },
  { id: "dev-103", name: "Kabir Shah", team: "Backend" },
  { id: "dev-104", name: "Nisha Iyer", team: "Quality" }
];

export default function handler(req, res) {
  res.status(200).json(developers);
}
