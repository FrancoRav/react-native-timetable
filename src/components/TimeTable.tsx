import React, { createContext, FC, useRef } from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';

import EventCard from './EventCard';
import TimeIndicator from './TimeIndicator';
import { EVENT_COLORS, THEME } from '../utils/constants';
import TimeTableTicks from './TimeTableTicks';
import WeekdayText from './WeekdayText';
import type { Configs, EventGroup, Event } from '../types';
import getEventsFromGroup from '../utils/getEventsFromGroup';
import TimeTableGrid from './TimeTableGrid';
import getConfigs from '../utils/getConfigs';

type TimeTableProps = {
  events?: Event[];
  eventGroups?: EventGroup[];
  eventOnPress?: (...args: any[]) => any;
  eventOnLongPress?: (...args: any[]) => any;
  eventColors?: string[];
  configs?: Partial<Configs>;
  headerStyle?: ViewStyle;
  disableHeader?: boolean;
  disableTicker?: boolean;
  contentContainerStyle?: ViewStyle;
  theme?: Partial<typeof THEME>;
};

export const ThemeContext = createContext<typeof THEME>(null);

export const ConfigsContext = createContext<Configs>(null);

const TimeTable: FC<TimeTableProps> = ({
  events,
  eventGroups,
  eventOnPress,
  eventOnLongPress,
  headerStyle,
  disableHeader,
  disableTicker,
  contentContainerStyle,
  eventColors = EVENT_COLORS,
  configs: propConfigs,
  theme: propTheme,
}) => {
  const weekdayScrollRef = useRef<null | ScrollView>(null);
  const courseHorizontalScrollRef = useRef<null | ScrollView>(null);
  const courseVerticalScrollRef = useRef<null | ScrollView>(null);

  const theme = {
    ...THEME,
    ...propTheme,
  };

  let configs = getConfigs(propConfigs);

  const onHorizontalScroll = (e) => {
    if (disableHeader) return;
    weekdayScrollRef.current.scrollTo({
      x: e.nativeEvent.contentOffset.x,
      animated: false,
    });
  };

  const currentDay = new Date();
  const currentWeekday = currentDay.getDay() ? currentDay.getDay() : 7;
  let weekendEvent = currentWeekday > 5; // Auto horizontal scroll if isWeekend and has weekendEvent
  let earlistGrid = configs.numOfHours; // Auto vertical scroll to earlistGrid

  // Parse eventGroups to events
  if (eventGroups) {
    const parsed = getEventsFromGroup({
      eventGroups,
      eventColors,
      configs,
    });
    events = parsed.events;
    configs = parsed.configs;
    configs.numOfHours = configs.endHour - configs.startHour + 1;
    earlistGrid = parsed.earlistGrid || earlistGrid;
    weekendEvent = weekendEvent && parsed.configs.numOfDays > 5;
  }

  const { pairwiseOverlaps } = findAllOverlaps(events);

  pairwiseOverlaps.forEach((op) => {
    op.event1.position = "left";
    op.event2.position = "right";
  })

  const { cellWidth, cellHeight, timeTicksWidth, numOfHours } = configs;

  const styles = getStyles({ timeTicksWidth, theme });

  return (
    <ConfigsContext.Provider value={configs}>
      <ThemeContext.Provider value={theme}>
        <View style={contentContainerStyle}>
          {!disableHeader && (
            <View style={[styles.weekdayRow, headerStyle]}>
              <View style={styles.placeholder} />
              <ScrollView
                scrollEnabled={false}
                ref={weekdayScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <WeekdayText />
              </ScrollView>
            </View>
          )}
          <ScrollView
            ref={courseVerticalScrollRef}
            contentContainerStyle={styles.courseContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (earlistGrid !== numOfHours) {
                courseVerticalScrollRef?.current?.scrollTo({
                  y: earlistGrid * cellHeight,
                });
              }
            }}
          >
            <TimeTableTicks />
            <ScrollView
              horizontal
              onScroll={onHorizontalScroll}
              scrollEventThrottle={16}
              ref={courseHorizontalScrollRef}
              contentContainerStyle={styles.courseList}
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => {
                weekendEvent &&
                  courseHorizontalScrollRef?.current?.scrollTo({
                    x: 2 * cellWidth,
                  });
              }}
            >
              <TimeTableGrid />
              {!disableTicker && <TimeIndicator />}
              {events.map((event, i) => (
                <EventCard
                  key={`${event.courseId}-${i}-${event.day}`}
                  event={{
                    ...event,
                    color: event.color || eventColors[i % eventColors.length],
                  }}
                  onPress={eventOnPress && (() => eventOnPress(event))}
                  onLongPress={eventOnLongPress && (() => eventOnLongPress(event))}
                />
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      </ThemeContext.Provider>
    </ConfigsContext.Provider>
  );
};

class TimeRange {
  day: Number;
  start: Number;
  end: Number;

  constructor(day: Number, start: string, end: string) {
    this.day = day;
    this.start = this.ttm(start);
    this.end = this.ttm(end);
  }

  ttm(time: string) {
    const [h, m] = time.split(':').map(x => parseInt(x, 10));
    return h * 60 + m;
  }

  overlaps(other: TimeRange) {
    return this.day === other.day && (this.start < other.end && this.end > other.start);
  }
}

const findAllOverlaps = (events: Event[]) => {
  // Convert events to TimeRange objects
  const timeRanges = events.map(event => new TimeRange(event.day, event.startTime, event.endTime));

  const overlaps = [];

  // Check each pair of events
  for (let i = 0; i < timeRanges.length; i++) {
    for (let j = i + 1; j < timeRanges.length; j++) {
      if (timeRanges[i].overlaps(timeRanges[j])) {
        overlaps.push({
          event1: events[i],
          event2: events[j]
        });
      }
    }
  }

  // Group overlapping events into clusters
  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < events.length; i++) {
    if (processed.has(i)) continue;

    const cluster = [events[i]];
    processed.add(i);

    for (let j = 0; j < events.length; j++) {
      if (i === j || processed.has(j)) continue;

      // Check if event j overlaps with any event in the current cluster
      const eventJRange = timeRanges[j];
      const hasOverlap = cluster.some((clusterEvent, _) => {
        const clusterEventRange = timeRanges[cluster.indexOf(clusterEvent)];
        return eventJRange.overlaps(clusterEventRange);
      });

      if (hasOverlap) {
        cluster.push(events[j]);
        processed.add(j);
      }
    }

    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }

  return {
    pairwiseOverlaps: overlaps,
    overlapClusters: clusters
  };
}


const getStyles = ({ timeTicksWidth, theme }) =>
  StyleSheet.create({
    weekdayRow: {
      flexDirection: 'row',
      height: 32,
      backgroundColor: theme.primary,
    },
    placeholder: {
      width: timeTicksWidth,
    },
    courseContainer: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      width: '100%',
    },
    courseList: {
      flexDirection: 'column',
    },
  });

export default TimeTable;
