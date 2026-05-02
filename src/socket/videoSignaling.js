/**
 * Socket.io signaling for PeerJS/WebRTC: join by appointment roomId, exchange peer IDs.
 * Doctor initiates the PeerJS call once both sides have registered.
 */

function ensureRoom(rooms, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { doctor: null, patient: null });
  }
  return rooms.get(roomId);
}

function tryPair(io, rooms, roomId) {
  const r = rooms.get(roomId);
  if (!r?.doctor?.peerId || !r?.patient?.peerId) return;
  io.to(r.doctor.socketId).emit("signal-start-call", { remotePeerId: r.patient.peerId });
}

function attachVideoSignaling(io) {
  const rooms = new Map();

  io.on("connection", (socket) => {
    socket.on("join-video-room", ({ roomId, role }) => {
      if (!roomId || (role !== "doctor" && role !== "patient")) return;
      const id = String(roomId);
      socket.join(id);
      socket.data.videoRoomId = id;
      socket.data.videoRole = role;
      socket.to(id).emit("user-connected", { role, socketId: socket.id });
    });

    socket.on("register-peer", ({ roomId, role, peerId }) => {
      if (!roomId || !peerId || (role !== "doctor" && role !== "patient")) return;
      const id = String(roomId);
      const r = ensureRoom(rooms, id);
      if (role === "doctor") r.doctor = { socketId: socket.id, peerId };
      else r.patient = { socketId: socket.id, peerId };
      tryPair(io, rooms, id);
    });

    socket.on("disconnect", () => {
      const id = socket.data.videoRoomId;
      const role = socket.data.videoRole;
      if (!id || !role) return;
      const r = rooms.get(id);
      if (!r) return;
      if (role === "doctor" && r.doctor?.socketId === socket.id) r.doctor = null;
      if (role === "patient" && r.patient?.socketId === socket.id) r.patient = null;
      if (!r.doctor && !r.patient) rooms.delete(id);
      socket.to(id).emit("user-disconnected", { role });
    });
  });
}

function parseSocketCorsOrigins() {
  const raw = process.env.FRONTEND_URL;
  if (!raw || raw === "*") return true;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

module.exports = { attachVideoSignaling, parseSocketCorsOrigins };
