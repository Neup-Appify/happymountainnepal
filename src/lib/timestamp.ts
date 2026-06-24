export class Timestamp {
  private readonly date: Date;

  constructor(date: Date | string | number = new Date()) {
    this.date = date instanceof Date ? date : new Date(date);
  }

  static fromDate(date: Date) {
    return new Timestamp(date);
  }

  static now() {
    return new Timestamp();
  }

  toDate() {
    return this.date;
  }

  toJSON() {
    return this.date.toISOString();
  }

  toString() {
    return this.date.toISOString();
  }
}
