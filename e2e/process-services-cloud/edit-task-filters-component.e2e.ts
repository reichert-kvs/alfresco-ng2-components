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

import { browser } from 'protractor';
import {
    AppListCloudPage,
    StringUtil,
    ApiService,
    LoginPage,
    TasksService,
    IdentityService,
    GroupIdentityService
} from '@alfresco/adf-testing';
import { NavigationBarPage } from '../core/pages/navigation-bar.page';
import { TasksCloudDemoPage } from './pages/tasks-cloud-demo.page';

describe('Edit task filters cloud', () => {

    const simpleApp = browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.name;

    const loginSSOPage = new LoginPage();
    const navigationBarPage = new NavigationBarPage();
    const appListCloudComponent = new AppListCloudPage();
    const tasksCloudDemoPage = new TasksCloudDemoPage();

    const apiService = new ApiService();
    const identityService = new IdentityService(apiService);
    const groupIdentityService = new GroupIdentityService(apiService);
    const tasksService = new TasksService(apiService);

    let testUser, groupInfo;

    const completedTaskName = StringUtil.generateRandomString(),
        assignedTaskName = StringUtil.generateRandomString();

    beforeAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);

        testUser = await identityService.createIdentityUserWithRole([identityService.ROLES.ACTIVITI_USER]);
        groupInfo = await groupIdentityService.getGroupInfoByGroupName('hr');
        await identityService.addUserToGroup(testUser.idIdentityService, groupInfo.id);

        await apiService.login(testUser.email, testUser.password);
        const assignedTask = await tasksService.createStandaloneTask(assignedTaskName, simpleApp);
        await tasksService.claimTask(assignedTask.entry.id, simpleApp);
        await tasksService.createAndCompleteTask(completedTaskName, simpleApp);

        await loginSSOPage.login(testUser.email, testUser.password);
    });

    afterAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        await identityService.deleteIdentityUser(testUser.idIdentityService);
    });

    beforeEach(async () => {
        await navigationBarPage.navigateToProcessServicesCloudPage();
        await appListCloudComponent.checkApsContainer();
        await appListCloudComponent.goToApp(simpleApp);
    });

    afterEach(async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
    });

    it('[C291785] All the filters property should be set up accordingly with the Query Param', async () => {
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('My Tasks');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getStatusFilterDropDownValue()).toEqual('ASSIGNED');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('CreatedDate');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getOrderFilterDropDownValue()).toEqual('DESC');
        await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(assignedTaskName);
        await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(completedTaskName);

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('completed-tasks');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('Completed Tasks');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getStatusFilterDropDownValue()).toEqual('COMPLETED');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('CreatedDate');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getOrderFilterDropDownValue()).toEqual('DESC');
        await tasksCloudDemoPage.taskListCloudComponent().checkContentIsNotDisplayedByName(assignedTaskName);
        await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedByName(completedTaskName);
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
    });

    it('[C306896] Delete Save and Save as actions should be displayed and disabled when clicking on default filter header', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('My Tasks');
        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();

        await editTaskFilterCloudComponent.checkSaveButtonIsDisplayed();
        await editTaskFilterCloudComponent.checkSaveAsButtonIsDisplayed();
        await editTaskFilterCloudComponent.checkDeleteButtonIsDisplayed();

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveButtonIsEnabled()).toEqual(false);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveAsButtonIsEnabled()).toEqual(false);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkDeleteButtonIsEnabled()).toEqual(false);
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
    });

    it('[C586756] Delete, Save and Save as actions should be displayed and enabled when clicking on custom filter header', async () => {
        await createNewCustomFilter('New');

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('custom-new');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('custom-new');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Priority');

        await editTaskFilterCloudComponent.checkSaveButtonIsDisplayed();
        await editTaskFilterCloudComponent.checkSaveAsButtonIsDisplayed();
        await editTaskFilterCloudComponent.checkDeleteButtonIsDisplayed();

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveButtonIsEnabled()).toEqual(true);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveAsButtonIsEnabled()).toEqual(true);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkDeleteButtonIsEnabled()).toEqual(true);
    });

    it('[C291795] New filter is added when clicking Save As button', async () => {
        await createNewCustomFilter('New');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveButtonIsEnabled()).toEqual(false);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkSaveAsButtonIsEnabled()).toEqual(false);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().checkDeleteButtonIsEnabled()).toEqual(true);
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('CreatedDate');
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('custom-new');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickDeleteButton();
    });

    it('[C291796] Two filters with same name can be created when clicking the Save As button', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Id');

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();

        const editTaskFilterDialog = editTaskFilterCloudComponent.editTaskFilterDialog();
        await editTaskFilterDialog.setFilterName('New');
        await editTaskFilterDialog.clickOnSaveButton();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().setSortFilterDropDown('Priority');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().setFilterName('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().clickOnSaveButton();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Priority');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickDeleteButton();
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('custom-new');

        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickDeleteButton();
    });

    it('[C291797] A filter is overrided when clicking on save button', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Id');

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();

        const editTaskFilterDialog = await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog();
        await editTaskFilterDialog.setFilterName('New');
        await editTaskFilterDialog.clickOnSaveButton();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().setSortFilterDropDown('Name');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveButton();
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Name');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickDeleteButton();
    });

    it('[C291798] A filter is deleted when clicking on delete button', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Id');

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();

        const editTaskFilterDialog = await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog();
        await editTaskFilterDialog.setFilterName('New');
        await editTaskFilterDialog.clickOnSaveButton();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('New');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickDeleteButton();

        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('My Tasks');
        await tasksCloudDemoPage.taskFilterCloudComponent.checkTaskFilterNotDisplayed('New');
    });

    it('[C291800] Task filter should not be created when task filter dialog is closed', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Priority');

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Priority');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getFilterName()).toEqual('My Tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().setFilterName('Cancel');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getFilterName()).toEqual('Cancel');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().clickOnCancelButton();
        await tasksCloudDemoPage.taskFilterCloudComponent.checkTaskFilterNotDisplayed('Cancel');
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toEqual('My Tasks');
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('completed-tasks');
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
        await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('My Tasks');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('CreatedDate');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
    });

    it('[C291801] Save button of task filter dialog should be disabled when task name is empty', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Id');

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getFilterName()).toEqual('My Tasks');

        const tasksCloud = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await tasksCloud.editTaskFilterDialog().clearFilterName();

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getFilterName()).toEqual('');

        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().checkSaveButtonIsEnabled()).toEqual(false);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().checkCancelButtonIsEnabled()).toEqual(true);
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().clickOnCancelButton();
    });

    it('[C291799] Task filter dialog is displayed when clicking on Save As button', async () => {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');
        const tasksCloud = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await tasksCloud.openFilter();
        await tasksCloud.setSortFilterDropDown('Id');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().getSortFilterDropDownValue()).toEqual('Id');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().checkSaveButtonIsEnabled()).toEqual(true);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().checkCancelButtonIsEnabled()).toEqual(true);
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getTitle()).toEqual('Save filter as');
        await expect(await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().getFilterName()).toEqual('My Tasks');
        await tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog().clickOnCancelButton();
    });

    async function createNewCustomFilter(name: string): Promise<void> {
        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        const editTaskFilterCloudComponent = tasksCloudDemoPage.editTaskFilterCloudComponent();
        await editTaskFilterCloudComponent.openFilter();
        await editTaskFilterCloudComponent.setSortFilterDropDown('Id');

        await tasksCloudDemoPage.taskFilterCloudComponent.clickTaskFilter('my-tasks');

        await tasksCloudDemoPage.editTaskFilterCloudComponent().clickSaveAsButton();

        const editTaskFilterDialog = tasksCloudDemoPage.editTaskFilterCloudComponent().editTaskFilterDialog();
        await editTaskFilterDialog.setFilterName(name);
        await editTaskFilterDialog.clickOnSaveButton();
    }
});
