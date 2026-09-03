/**
 * 1項目分（計画行＋実績行）のセルをSVGで描画する。
 */
import { Fragment } from "react";
import { Rect } from "react-native-svg";
import { isToday, isWeekend } from "date-fns";
import type { GanttItem } from "../types";
import type { GridColumn } from "../ganttGeometry";
import { getActualCellColor, getPlanCellColor } from "../ganttCellColor";

type Props = {
  item: GanttItem;
  itemIndex: number;
  columns: GridColumn[];
  targetDate: string | null;
  cellHeight: number;
  showBottomBorder: boolean;
};

const EMPTY_CELL_FILL = "#f9fafb";
const GRID_LINE_COLOR = "#f3f4f6";

export function GanttRow({ item, itemIndex, columns, targetDate, cellHeight, showBottomBorder }: Props) {
  const planY = itemIndex * cellHeight * 2;
  const actualY = planY + cellHeight;
  const totalWidth = columns.length > 0 ? columns[columns.length - 1].x + columns[columns.length - 1].width : 0;

  return (
    <Fragment>
      {columns.map((col) => {
        if (col.dateStr === null) {
          return (
            <Fragment key={`${item.id}-empty-${col.x}`}>
              <Rect x={col.x} y={planY} width={col.width} height={cellHeight} fill={EMPTY_CELL_FILL} />
              <Rect x={col.x} y={actualY} width={col.width} height={cellHeight} fill={EMPTY_CELL_FILL} />
            </Fragment>
          );
        }

        const date = new Date(`${col.dateStr}T00:00:00`);
        const weekend = isWeekend(date);
        const today = isToday(date);
        const isTarget = !!targetDate && col.dateStr === targetDate;
        const planFilled = item.planDates.includes(col.dateStr);
        const actualFilled = item.actualDates.includes(col.dateStr);

        return (
          <Fragment key={`${item.id}-${col.dateStr}`}>
            <Rect
              x={col.x}
              y={planY}
              width={col.width}
              height={cellHeight}
              fill={getPlanCellColor({
                filled: planFilled,
                isTargetDate: isTarget,
                isToday: today,
                isWeekend: weekend,
              })}
              stroke={GRID_LINE_COLOR}
              strokeWidth={0.5}
            />
            <Rect
              x={col.x}
              y={actualY}
              width={col.width}
              height={cellHeight}
              fill={getActualCellColor({
                filled: actualFilled,
                isTargetDate: isTarget,
                isToday: today,
                isWeekend: weekend,
              })}
              stroke={GRID_LINE_COLOR}
              strokeWidth={0.5}
            />
          </Fragment>
        );
      })}
      {showBottomBorder && (
        <Rect x={0} y={actualY + cellHeight - 1.5} width={totalWidth} height={1.5} fill="#e5e7eb" />
      )}
    </Fragment>
  );
}
