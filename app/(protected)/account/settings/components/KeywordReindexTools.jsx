'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import ReindexMyKeywords from './ReindexMyKeywords';
import ReindexSkiKeywords from './ReindexSkiKeywords';

export default function KeywordReindexTools() {
    return (
        <Card className="p-5 md:p-6">
            <div className="space-y-2">
                <h2 className="text-xl font-medium text-gray-800 mb-6">Search repair tool</h2>
                <p className="text-xs text-gray-600">
                    If search stops finding your skis or results, re-index the keyword fields used by search.
                </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <ReindexSkiKeywords />

                <ReindexMyKeywords />
            </div>

            <p className="mt-3 text-xs text-gray-500">
                Note: this updates your documents in Firestore (it may take a moment for search to reflect changes).
            </p>
        </Card>
    );
}