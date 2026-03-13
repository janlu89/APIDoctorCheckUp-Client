import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "timeAgo", standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return "Never";

    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

    if (seconds < 10)  return "Just now";
    if (seconds < 60)  return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)  return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  }
}
