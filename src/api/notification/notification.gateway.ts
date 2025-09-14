import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private clients: Map<string, string> = new Map();

  handleConnection(client: any) {
    console.log("Client connected:", client.id);
  }

  handleDisconnect(client: any) {
    console.log("Client disconnected:", client.id);
    [...this.clients.entries()].forEach(([clientId, socketId]) => {
      if (socketId === client.id) {
        this.clients.delete(clientId);
      }
    });
  }

  registerClient(client_id: string, socketId: string) {
    this.clients.set(client_id, socketId);
  }

  sendNotification(client_id: string, message: string) {
    const socketId = this.clients.get(client_id);
    if (socketId) {
      this.server.to(socketId).emit("notification", { message });
    }
  }
}
