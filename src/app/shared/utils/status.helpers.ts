import { EndpointStatus } from "../../core/models/api.models";

export interface StatusDisplay {
  label: string;
  cssClass: string;
}

export function getStatusDisplay(status: EndpointStatus): StatusDisplay {
  switch (status) {
    case EndpointStatus.Up:
      return { label: "Up",       cssClass: "status-badge--up"       };
    case EndpointStatus.Degraded:
      return { label: "Degraded", cssClass: "status-badge--degraded" };
    case EndpointStatus.Down:
      return { label: "Down",     cssClass: "status-badge--down"     };
    default:
      return { label: "Unknown",  cssClass: "status-badge--unknown"  };
  }
}
