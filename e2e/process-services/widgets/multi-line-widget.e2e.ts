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

import {
    ApiService,
    ApplicationsUtil,
    BrowserActions,
    LoginPage,
    ProcessUtil,
    UsersActions,
    Widget
} from '@alfresco/adf-testing';
import { TasksPage } from '../pages/tasks.page';
import { browser } from 'protractor';
import CONSTANTS = require('../../util/constants');

describe('Multi-line Widget', () => {
    const app = browser.params.resources.Files.WIDGET_CHECK_APP.MULTILINE_TEXT;

    const loginPage = new LoginPage();
    const taskPage = new TasksPage();
    const widget = new Widget();

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);
    const applicationsService = new ApplicationsUtil(apiService);

    let appModel;
    let processUserModel;
    let deployedApp, process;

    beforeAll(async () => {
       await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

       processUserModel = await usersActions.createUser();

       await apiService.getInstance().login(processUserModel.email, processUserModel.password);
       appModel = await applicationsService.importPublishDeployApp(browser.params.resources.Files.WIDGET_CHECK_APP.file_path);

       const appDefinitions = await apiService.getInstance().activiti.appsApi.getAppDefinitions();
       deployedApp = appDefinitions.data.find((currentApp) => {
            return currentApp.modelId === appModel.id;
        });
       process = await new ProcessUtil(apiService).startProcessByDefinitionName(appModel.name, app.processName);
       await loginPage.login(processUserModel.email, processUserModel.password);
   });

    beforeEach(async () => {
        const urlToNavigateTo = `${browser.baseUrl}/activiti/apps/${deployedApp.id}/tasks/`;
        await BrowserActions.getUrl(urlToNavigateTo);
        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.formFields().checkFormIsDisplayed();
    });

    afterAll(async () => {
        await apiService.getInstance().activiti.processApi.deleteProcessInstance(process.id);
        await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        await apiService.getInstance().activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
   });

    it('[C268182] Should be able to set general properties for Multi-line Text Widget', async () => {
        const label = await widget.multilineTextWidget().getFieldLabel(app.FIELD.multiSimple);
        await expect(label).toBe('multiSimple*');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);
        const placeHolder = await widget.multilineTextWidget().getFieldPlaceHolder(app.FIELD.multiSimple);
        await expect(placeHolder).toBe('Type something...');
        await widget.multilineTextWidget().setValue(app.FIELD.multiSimple, 'TEST');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(true);
    });

    it('[C268184] Should be able to set advanced properties for Multi-line Text Widget', async () => {
        await widget.multilineTextWidget().setValue(app.FIELD.multiMinMax, 'A');
        await expect(await widget.multilineTextWidget().getErrorMessage(app.FIELD.multiMinMax)).toContain('Enter at least 4 characters');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);
        await widget.multilineTextWidget().setValue(app.FIELD.multiMinMax, 'AAAAAAAAAAA');
        await expect(await widget.multilineTextWidget().getErrorMessage(app.FIELD.multiMinMax)).toContain('Enter no more than 10 characters');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);
        await widget.multilineTextWidget().setValue(app.FIELD.multiMinMax, 'AAAA');

        await widget.multilineTextWidget().setValue(app.FIELD.multiSimple, 'TEST');
        await widget.multilineTextWidget().setValue(app.FIELD.multiRegexp, '3');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(false);
        await expect(await widget.multilineTextWidget().getErrorMessage(app.FIELD.multiRegexp)).toContain('Enter a different value');
        await widget.multilineTextWidget().setValue(app.FIELD.multiRegexp, 'TE');
        await expect(await taskPage.formFields().isCompleteFormButtonEnabled()).toEqual(true);
    });

    it('[C268232] Should be able to set visibility properties for Multi-line Text Widget', async () => {
        await widget.textWidget().isWidgetNotVisible(app.FIELD.multiVisible);
        await widget.textWidget().setValue(app.FIELD.showMultiHidden, '1');
        await widget.textWidget().isWidgetVisible(app.FIELD.multiVisible);
    });
});
