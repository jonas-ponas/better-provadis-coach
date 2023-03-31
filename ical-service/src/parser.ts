import { decode } from 'html-entities';
import logger from './logger';
import ICAL, { Component, Property } from 'ical.js';
import { writeFileSync } from 'fs';

type Link = { teacher: string; link: string };
type ContentWithFilename = { name: string; content: string };

export function getLinksFromHtml(htmlTexts: string[]): Link[] {
	let allLinks: Link[] = [];
	for (const content of htmlTexts) {
		logger.verbose('HTMl Parse Loop');
		const array = Array.from(content.matchAll(/(https:\/\/.*?)'\starget="_blank">(.*?)</g), m => {
			return `${m[2]}|||${m[1]}`;
		});
		const links = Array.from(new Set(array)).map((v: any) => {
			const [teacher, link] = v.split('|||');
			return { link, teacher: decode(teacher) };
		});
		allLinks = [...allLinks, ...links];
	}
	return allLinks.reduce<Link[]>((pre, current: Link) => {
		if (!pre.includes(current)) return [...pre, current];
		return pre;
	}, []);
}

/**
 * Takes all Ical-Files in icsTexts and merges them into one
 * @param icsTexts
 * @param links links returned by getLinksFromHtml
 * @returns string: one ical-file
 */
export function mergeIcalFiles(icsTexts: ContentWithFilename[], links: Link[]): string {
	logger.verbose(links);
	const vCalendar = getCalendarComponent(icsTexts.map(v => v.name));
	let id = 0;
	for (const ical of icsTexts) {
		const jcal = ICAL.parse(ical.content);
		writeFileSync('../jcal.json', JSON.stringify(jcal));
		const cal = new Component(jcal);
		const vEvents = cal.getAllSubcomponents('vevent');
		logger.debug(`file ${ical.name} contains ${vEvents.length} events`);
		for (const event of vEvents) {
			vCalendar.addSubcomponent(getEvent(event, links, id));
			id++;
		}
	}
	let ical = vCalendar.toString();
	links
		.map(v => v.teacher)
		.forEach(teacher => {
			ical = ical.replace(RegExp(teacher.toUpperCase(), 'g'), teacher);
		});
	return ical;
}

/**
 * Created inital vCalendar with meta-data
 * @param filenames List of .ics Files merged in this one
 * @returns vCalendar-Component
 */
export function getCalendarComponent(filenames: string[]): Component {
	const vCalendar = new Component('vcalendar');
	setProperties(vCalendar, {
		PRODID: 'Better Provadis Coach',
		VERSION: '0.0.1-alpha',
		'BPC-VERSION': '0.0.1-alpha',
		'BPC-CONTAINS': filenames
	});
	vCalendar.addSubcomponent(getTimezoneComponent());
	return vCalendar;
}

export function getTimezoneComponent(): Component {
	const vTimezone = new Component('vtimezone');
	setProperties(vTimezone, {
		TZID: 'Europe/Berlin'
	});
	const daylight = new Component('daylight');
	const standard = new Component('standard');
	setProperties(daylight, {
		TZNAME: 'CEST',
		DTSTART: '19960101T020000',
		RRULE: 'FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
		TZOFFSETFROM: '+0100',
		TZOFFSETTO: '+0200'
	});
	setProperties(standard, {
		TZNAME: 'CET',
		DTSTART: '19960101T020000',
		RRULE: 'FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
		TZOFFSETFROM: '+0200',
		TZOFFSETTO: '+0100'
	});
	vTimezone.addSubcomponent(standard);
	vTimezone.addSubcomponent(daylight);
	return vTimezone;
}

function getEvent(event: Component, links: Link[], id: number) {
	const component = new Component('vevent');
	const title = event.getFirstPropertyValue('summary');
	const dtstamp = event.getFirstPropertyValue('dtstamp');
	const dtstart = event.getFirstPropertyValue('dtstart');
	const dtend = event.getFirstPropertyValue('dtend');
	if (!dtstart || !dtstamp || !dtend || !title) {
		event.addPropertyWithValue('uid', `BCP${id}`);
		return event;
	}
	setProperties(component, {
		dtstart,
		dtstamp,
		dtend
	});
	const [lesson, teacher] = title.split(' - ');
	if (!lesson || !teacher) {
		logger.warn(`Uncommon Title "${title}"`);
		component.addPropertyWithValue('summary', title);
	} else {
		const zoomLink = findLinkForTeacher(links, teacher);
		let properties = {
			summary: lesson,
			uid: `BCP${id}`
		};
		if (zoomLink) {
			setProperties(component, {
				...properties,
				url: zoomLink.link,
				[`organizer;CN="${zoomLink.teacher}"`]: 'mailto:dummy@example.com',
				location: zoomLink.link
			});
		} else {
			setProperties(component, properties);
		}
	}
	return component;
}
/**
 * Always returns undefined if multiple teachers are detected!
 * @param haystack links from parsed html
 * @param needle teacher to find link fo
 * @returns Link if found, undefined if not
 */
function findLinkForTeacher(haystack: Link[], needle: string) {
	if (needle.includes(',')) return undefined;
	return haystack.find(link => {
		const teacher = (link.teacher.split(' ').pop() || '').toLowerCase();
		const organizer = (needle.split(' ').pop() || '').toLowerCase();
		return teacher === organizer;
	});
}

function setProperties(component: Component, properties: { [key: string]: string | string[] }) {
	for (const [key, value] of Object.entries(properties)) {
		component.addPropertyWithValue(key, value);
	}
	return component;
}
