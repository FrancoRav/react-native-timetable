import React, { FC, useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import type { Configs, Event } from '../types';
import { ConfigsContext } from './TimeTable';

type EventCardProps = {
  event: Event;
  onPress?: (...args: any[]) => any;
};

const EventCard: FC<EventCardProps> = ({ event, onPress, onLongPress }) => {
  const configs = useContext(ConfigsContext);
  const styles = getStyles(event, configs);
  const position = event.position || "full";
  const style = position === 'left' ? styles.courseCardLeft : position === 'right' ? styles.courseCardRight : styles.courseCard;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[style, styles.innerCard]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Text style={styles.courseCardTitle} ellipsizeMode="clip">
        {`${event.courseId}${event.section ? ` ${event.section}` : ''}`}
      </Text>
      <Text style={styles.courseCardLocation}>{event.location}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (event: Event, configs: Configs) => {
  const { cellWidth, cellHeight, startHour } = configs;
  const sTime = event.startTime.split(':').map((x) => parseInt(x, 10));
  const eTime = event.endTime.split(':').map((x) => parseInt(x, 10));
  const topMarginValue =
    (sTime[0] - startHour) * cellHeight + (sTime[1] / 60.0) * cellHeight;
  const durationHeight =
    cellHeight * (eTime[0] - sTime[0] + (eTime[1] - sTime[1]) / 60.0);
  const textColor = event.color;
  const bgColor = event.background;
  const styles = StyleSheet.create({
    courseCard: {
      position: 'absolute',
      borderRadius: 4,
      zIndex: 2,
      width: cellWidth - 3,
      marginLeft: cellWidth * (event.day - 1),
      height: durationHeight,
      marginTop: topMarginValue,
    },
    courseCardLeft: {
      position: 'absolute',
      borderRadius: 4,
      zIndex: 2,
      width: cellWidth/2 - 3,
      marginLeft: cellWidth * (event.day - 1),
      height: durationHeight,
      marginTop: topMarginValue,
    },
    courseCardRight: {
      position: 'absolute',
      borderRadius: 4,
      zIndex: 2,
      width: cellWidth/2 - 3,
      marginLeft: cellWidth * (event.day - 1) + cellWidth/2,
      height: durationHeight,
      marginTop: topMarginValue,
    },
    innerCard: {
      flex: 1,
      overflow: 'hidden',
      borderRadius: 4,
      padding: 4,
      backgroundColor: bgColor,
    },
    courseCardTitle: {
      fontSize: 10,
      lineHeight: 11,
      fontWeight: 'bold',
      color: textColor,
    },
    courseCardLocation: {
      marginTop: 2,
      fontSize: 10,
      color: textColor,
    },
  });
  return styles;
};

export default EventCard;
