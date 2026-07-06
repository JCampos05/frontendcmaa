import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horaAmPm',
  standalone: true
})
export class HoraAmPmPipe implements PipeTransform {
  transform(hora: string | null | undefined): string {
    if (!hora) return '';

    const [horasStr, minutosStr] = hora.split(':');
    const horas = parseInt(horasStr, 10);
    if (isNaN(horas)) return hora;

    const periodo = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 === 0 ? 12 : horas % 12;

    return `${horas12}:${minutosStr} ${periodo}`;
  }
}
