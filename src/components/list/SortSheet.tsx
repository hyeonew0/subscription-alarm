import React from 'react';
import { LIST_SORT_LABELS, LIST_SORT_ORDER, type ListSort } from '../../domain/listSort';
import { OptionSheet } from '../form/OptionSheet';

export interface SortSheetProps {
  visible: boolean;
  sort: ListSort;
  onSelect: (sort: ListSort) => void;
  onClose: () => void;
}

/** 목록 정렬 선택 바텀시트: D-순 / 금액 높은순 / 금액 낮은순 / 이름순 */
export function SortSheet({ visible, sort, onSelect, onClose }: SortSheetProps) {
  return (
    <OptionSheet
      visible={visible}
      title="정렬"
      options={LIST_SORT_ORDER.map((mode) => ({ value: mode, label: LIST_SORT_LABELS[mode] }))}
      selected={sort}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
