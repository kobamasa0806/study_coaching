/** ガントチャート表示用の項目（単元）。Task の一部フィールドをcamelCaseで保持するビューモデル。 */
export type GanttItem = {
  id: string;
  name: string;
  planDates: string[];
  actualDates: string[];
};

/** ガントチャートの行種別 */
export type GanttRowType = "plan" | "actual";
