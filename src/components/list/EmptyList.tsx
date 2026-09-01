import { useRouter } from 'expo-router';
import React from 'react';
import { EmptyStateCard } from '../EmptyStateCard';

/** 구독 0개 목록 빈 상태 카드 (Figma 02_목록_빈상태) */
export function EmptyList() {
  const router = useRouter();
  return (
    <EmptyStateCard
      icon="list"
      title="아직 등록한 구독이 없어요"
      buttonLabel="구독 추가하기"
      onPress={() => router.push('/add')}
    />
  );
}
