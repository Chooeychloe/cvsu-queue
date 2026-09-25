import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    // Public display screens join a shared room
    socket.on('join:public-display', () => {
      socket.join('public-display');
    });

    // Staff dashboards join a room scoped to their office so updates
    // for other offices don't get pushed to them unnecessarily.
    socket.on('join:office', (officeId) => {
      socket.join(`office:${officeId}`);
    });

    socket.on('disconnect', () => {
      // no-op: rooms are cleaned up automatically
    });
  });

  return io;
}

export function getIO() {
  return io;
}
