/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, Output, OnInit, OnChanges, EventEmitter, SimpleChanges, ViewEncapsulation, ViewChild, Inject, OnDestroy } from '@angular/core';
import { DataColumn } from '@alfresco/adf-core';
import { SearchWidgetContainerComponent } from '../search-widget-container/search-widget-container.component';
import { SearchHeaderQueryBuilderService } from '../../search-header-query-builder.service';
import { NodePaging } from '@alfresco/js-api';
import { SearchCategory } from '../../search-category.interface';
import { SEARCH_QUERY_SERVICE_TOKEN } from '../../search-query-service.token';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'adf-search-header',
    templateUrl: './search-header.component.html',
    styleUrls: ['./search-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SearchHeaderComponent implements OnInit, OnChanges, OnDestroy {
    @Input()
    col: DataColumn;

    @Input()
    currentFolderNodeId: string;

    @Input()
    maxItems: number;

    @Input()
    skipCount: number;

    @Output()
    update: EventEmitter<NodePaging> = new EventEmitter();

    @Output()
    clear: EventEmitter<any> = new EventEmitter();

    @ViewChild(SearchWidgetContainerComponent)
    widgetContainer: SearchWidgetContainerComponent;

    public isActive: boolean;

    category: SearchCategory;
    isFilterServiceActive: boolean;

    private onDestroy$ = new Subject<boolean>();

    constructor(@Inject(SEARCH_QUERY_SERVICE_TOKEN) private searchHeaderQueryBuilder: SearchHeaderQueryBuilderService) {
        this.isFilterServiceActive = this.searchHeaderQueryBuilder.isFilterServiceActive();
    }

    ngOnInit() {
        this.category = this.searchHeaderQueryBuilder.getCategoryForColumn(
            this.col.key
        );

        this.searchHeaderQueryBuilder.executed
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((newNodePaging: NodePaging) => {
                this.update.emit(newNodePaging);
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['currentFolderNodeId'] && changes['currentFolderNodeId'].currentValue) {
            const currentIdValue = changes['currentFolderNodeId'].currentValue;
            const previousIdValue = changes['currentFolderNodeId'].previousValue;
            this.searchHeaderQueryBuilder.setCurrentRootFolderId(
                currentIdValue,
                previousIdValue
            );

            this.isActive = false;
        }

        if (changes['maxItems'] || changes['skipCount']) {
            let actualMaxItems = this.maxItems;
            let actualSkipCount = this.skipCount;

            if (changes['maxItems'] && changes['maxItems'].currentValue) {
                actualMaxItems = changes['maxItems'].currentValue;
            }
            if (changes['skipCount'] && changes['skipCount'].currentValue) {
                actualSkipCount = changes['skipCount'].currentValue;
            }

            this.searchHeaderQueryBuilder.setupCurrentPagination(actualMaxItems, actualSkipCount);
        }
    }

    ngOnDestroy() {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    onMenuButtonClick(event: Event) {
        event.stopPropagation();
    }

    onMenuClick(event: Event) {
        event.stopPropagation();
    }

    onApplyButtonClick() {
        this.isActive = true;
        this.widgetContainer.applyInnerWidget();
        this.searchHeaderQueryBuilder.setActiveFilter(this.category.columnKey);
        this.searchHeaderQueryBuilder.execute();
    }

    onClearButtonClick(event: Event) {
        event.stopPropagation();
        this.widgetContainer.resetInnerWidget();
        this.isActive = false;
        this.searchHeaderQueryBuilder.removeActiveFilter(this.category.columnKey);
        if (this.searchHeaderQueryBuilder.isNoFilterActive()) {
            this.clear.emit();
        } else {
            this.searchHeaderQueryBuilder.execute();
        }
    }
}