import { IReserva } from "../models/Reserva";

export class ReservaPolicy {
  canAccess(usuarioId: string, reserva: IReserva): boolean {
    return String(reserva.usuario) === String(usuarioId);
  }

  canCancel(usuarioId: string, usuarioTipo: string, reserva: IReserva): boolean {
    const isOwner = String(reserva.usuario) === String(usuarioId);
    const isPrivileged = ["barbeiro", "admin", "staff"].includes(usuarioTipo);
    return isOwner || isPrivileged;
  }

  canPay(usuarioId: string, reserva: IReserva): boolean {
    return String(reserva.usuario) === String(usuarioId);
  }
}
export const reservaPolicy = new ReservaPolicy();
