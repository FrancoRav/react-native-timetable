interface Event {
  courseId: string;
  day: number;
  startTime: string;
  endTime: string;
  color?: string;
  background?: string;
  title?: string;
  location?: string;
  section?: string;
  position?: string; // position of the event in case of overlap. determined automatically
  groupIndex?: number; // index of the group in eventGroups array that this event belongs to
}

interface Events {
  startTimes: string[];
  endTimes: string[];
  days: number[];
  locations: string[];
}

interface Sections {
  [section: string]: Events;
}

interface EventGroup {
  courseId: string;
  sections: Sections;
  title?: string;
}

interface Configs {
  startHour: number;
  endHour: number;
  numOfHours: number;
  cellWidth: number;
  cellHeight: number;
  numOfDays: number;
  numOfDaysPerPage: number;
  timeTicksWidth: number;
}

export { EventGroup, Events, Event, Configs };
