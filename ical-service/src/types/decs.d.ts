declare module 'ical.js' {
	function parse(str: string): any[];
	function stringify(jcal: any[]): string;

	class Binary {
		constructor(aValue: string);
		fromString(aString: string): Binary;
		decodeValue(): string;
		setEncodedValue(aValue: string): void;
		toString(): string;
	}

	class Component {
		constructor(jCal: string[] | string, parent?: Component);
		readonly name;
		static fromString(): string;
		addProperty(property: Property): Property;
		addPropertyWithValue(name: string, value: string | number | object): Property;
		addSubcomponent(component: Component): Component;
		getAllProperties(name?: string): Property[];
		getAllSubcomponents(name?: string): Component[];
		getFirstProperty(name?: string): Property | null;
		getFirstPropertyValue(name?: string): string | null;
		getFirstSubcomponent(name?: string): Component | null;
		hasProperty(name: string): boolean;
		removeAllProperties(name?: string): boolean;
		removeAllSubcomponents(name?: string): void;
		removeProperty(nameOrProp: string | Property): boolean;
		removeSubcomponent(nameOrComp: string | Component): boolean;
		toJSON(): object;
		toString(): string;
		updatePropertyWithValue(name: string, value: string | number | object): Property;
	}

	class ComponentParser {
		constructor(options?: { parseEvent: boolean; parseTimezone: boolean });
		process(ical: Component | string | object): void;
	}

	type DurationOptions = {
		weeks: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		isNegative: boolean;
	};

	class Duration {
		constructor(data: DurationOptions);
		weeks: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		isNegative: boolean;
		icaltype: string;
		icalclass: string;
		static fromData(aData: DurationOptions): Duration;
		static fromSeconds(aSeconds: number): Duration;
		static fromString(aStr: string): Duration;
		static isValueString(value: string): boolean;
		clone(): Duration;
		compare(aOther: Duration): number;
		fromData(aData: DurationOptions);
		fromSeconds(aSeconds: number): Duration;
		normalize(): void;
		reset(): void;
		toICALString(): string;
		toSeconds(): number;
		toString(): string;
	}

	class Event {
		constructor(
			component?: Component,
			options: {
				strictExceptions: boolean;
				exceptions: Component[];
			}
		);
		readonly attendees: Property[];
		color: string;
		description: string;
		duration: Duration;
		endDate: Time;
		exceptions: Event[];
		location: string;
		organizer: string;
		recurrenceId: Time;
		sequence: number;
		startDate: Time;
		strictExceptions: boolean;
		summary: string;
		uid: string;
		occurrenceDetails: {
			recurrenceId: Time;
			item: Event;
			startDate: Time;
			endDate: Time;
		};
		findRangeException(time: Time): Event | null;
		getOccurrenceDetails(occurence: Time): Event.occurrenceDetails;
		getRecurrenceTypes(): unknown; // {Object.<ICAL.Recur.frequencyValues, Boolean>}
		isRecurrenceException(): boolean;
		isRecurring(): boolean;
		iterator(startTime: Time): unknown; // {ICAL.RecurExpansion}
		modifiesFuture(): boolean;
		relateException(obj: Component | Event);
		toString(): string;
	}

	class Property {
		constructor(jCal: string[] | string, parent?: Component);
		readonly name: string;
		parent: Component;
		readonly type: Component;
		static fromString(str: string, designSet?: unknown): Property; // {ICAL.design.designSet}
		getDefaultType(): string;
		getFirstParameter(name): string;
		getFirstValue(): string;
		getParameter(name: string): string[] | string;
		getValues(): string[];
		removeAllValues(): void;
		removeParameter(name: string): void;
		resetType(type: string): void;
		setValue(value: string | object): void;
		setValues(values: string[]): void;
		toICALString(): string;
		toJSON(): object;
	}

	class Time {
		// ..
		toJSDate(): Date;
	}

	/**
	 *
	 * @ str
	 */
}
