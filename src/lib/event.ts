import eventData from "../../data/event.json";

export type EventInfo = {
  title: string;
  organization: string;
};

export function getEventInfo(): EventInfo {
  return eventData as EventInfo;
}
