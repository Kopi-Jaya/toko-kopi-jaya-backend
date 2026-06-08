import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: '*', credentials: true },
})
export class OrdersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{
        sub: number;
        type: 'member' | 'staff';
      }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      client.data.user = payload;

      // Members join a room keyed by member_id so emitOrderUpdated can
      // target only the right client.
      if (payload.type === 'member') {
        await client.join(`member:${payload.sub}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // Socket.IO cleans up rooms automatically on disconnect.
  }

  /**
   * Broadcast an order update to the member who owns the order.
   * Called by OrdersService.updateStatus after a successful transition.
   */
  emitOrderUpdated(order: Order, memberId: number | null): void {
    if (memberId != null) {
      this.server.to(`member:${memberId}`).emit('order_updated', order);
    }
  }
}
