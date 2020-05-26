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

import { RepoApi } from '../repo-api';
import { Logger } from '../../../core/utils/logger';
import { ApiUtil } from '../../../core/structure/api.util';
import {
    Site,
    SiteBody,
    SiteMemberRoleBody,
    SiteMemberBody,
    SiteEntry,
    SiteMembershipRequestEntry,
    SitesApi as AdfSiteApi,
    SiteMemberEntry
} from '@alfresco/js-api';

export class SitesApi extends RepoApi {
  sitesApi = new AdfSiteApi(this.alfrescoJsApi);

  constructor(username: string, password: string) {
    super(username, password);
  }

  async getSite(siteId: string) {
    try {
      await this.apiLogin();
      return await this.sitesApi.getSite(siteId);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getSite.name}`, error);
      return null;
    }
  }

  async getSites() {
    try {
      await this.apiLogin();
      return await this.sitesApi.listSiteMembershipsForPerson(this.getUsername());
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getSites.name}`, error);
      return null;
    }
  }

  async getDocLibId(siteId: string) {
    try {
      await this.apiLogin();
      return (await this.sitesApi.listSiteContainers(siteId)).list.entries[0].entry.id;
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getDocLibId.name}`, error);
      return null;
    }
  }

  async getVisibility(siteId: string) {
    try {
      const site = await this.getSite(siteId);
      return site.entry.visibility;
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getVisibility.name}`, error);
      return null;
    }
  }

  async getDescription(siteId: string) {
    try {
      const site = await this.getSite(siteId);
      return site.entry.description;
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getDescription.name}`, error);
      return null;
    }
  }

  async getTitle(siteId: string) {
    try {
      const site = await this.getSite(siteId);
      return site.entry.title;
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.getTitle.name}`, error);
      return null;
    }
  }

  async createSite(title: string, visibility?: string, description?: string, siteId?: string): Promise<SiteEntry> {
    const site = {
        title,
        visibility: visibility || Site.VisibilityEnum.PUBLIC,
        description: description,
        id: siteId || title
    } as SiteBody;

    try {
      await this.apiLogin();
      return await this.sitesApi.createSite(site);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.createSite.name}`, error);
      return null;
    }
  }

  async createSitePrivate(title: string, description?: string, siteId?: string): Promise<SiteEntry> {
    return this.createSite(title, Site.VisibilityEnum.PRIVATE, description, siteId);
  }

  async createSiteModerated(title: string, description?: string, siteId?: string): Promise<SiteEntry> {
    return this.createSite(title, Site.VisibilityEnum.MODERATED, description, siteId);
  }

  async createSites(titles: string[], visibility?: string): Promise<any> {
    try {
      return titles.reduce(async (previous: any, current: any) => {
        await previous;
        return this.createSite(current, visibility);
      }, Promise.resolve());
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.createSites.name}`, error);
    }
  }

  async createSitesPrivate(siteNames: string[]): Promise<any> {
    return this.createSites(siteNames, Site.VisibilityEnum.PRIVATE);
  }

  async deleteSite(siteId: string, permanent: boolean = true) {
    try {
      await this.apiLogin();
      return await this.sitesApi.deleteSite(siteId, { permanent });
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.deleteSite.name}`, error);
    }
  }

  async deleteSites(siteIds: string[], permanent: boolean = true) {
    try {
      return siteIds.reduce(async (previous, current) => {
        await previous;
        return this.deleteSite(current, permanent);
      }, Promise.resolve());
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.deleteSites.name}`, error);
    }
  }

  async deleteAllUserSites(permanent: boolean = true) {
    try {
      const siteIds = (await this.getSites()).list.entries.map(entries => entries.entry.id);

      return await siteIds.reduce(async (previous, current) => {
        await previous;
        return this.deleteSite(current, permanent);
      }, Promise.resolve());
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.deleteAllUserSites.name}`, error);
    }
  }

  async updateSiteMember(siteId: string, userId: string, role: string) {
    const siteRole = {
        role: role
    } as SiteMemberRoleBody;

    try {
      await this.apiLogin();
      return await this.sitesApi.updateSiteMembership(siteId, userId, siteRole);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.updateSiteMember.name}`, error);
      return null;
    }
  }

  async addSiteMember(siteId: string, userId: string, role: string) {
    const memberBody = {
        id: userId,
        role: role
    } as SiteMemberBody;

    try {
      await this.apiLogin();
      return await this.sitesApi.createSiteMembership(siteId, memberBody);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.addSiteMember.name}`, error);
      return null;
    }
  }

  async addSiteConsumer(siteId: string, userId: string): Promise<SiteMemberEntry> {
    return this.addSiteMember(siteId, userId, Site.RoleEnum.SiteConsumer);
  }

  async addSiteContributor(siteId: string, userId: string): Promise<SiteMemberEntry> {
    return this.addSiteMember(siteId, userId, Site.RoleEnum.SiteContributor);
  }

  async addSiteCollaborator(siteId: string, userId: string): Promise<SiteMemberEntry> {
    return this.addSiteMember(siteId, userId, Site.RoleEnum.SiteCollaborator);
  }

  async addSiteManager(siteId: string, userId: string): Promise<SiteMemberEntry> {
    return this.addSiteMember(siteId, userId, Site.RoleEnum.SiteManager);
  }

  async deleteSiteMember(siteId: string, userId: string) {
    try {
      await this.apiLogin();
      return await this.sitesApi.deleteSiteMembership(siteId, userId);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.deleteSiteMember.name}`, error);
    }
  }

  async requestToJoin(siteId: string): Promise<SiteMembershipRequestEntry> {
    const body = {
      id: siteId
    };

    try {
      await this.apiLogin();
      return await this.sitesApi.createSiteMembershipRequestForPerson('-me-', body);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.requestToJoin.name}`, error);
      return null;
    }
  }

  async hasMembershipRequest(siteId: string) {
    try {
      await this.apiLogin();
      const requests = (await this.sitesApi.getSiteMembershipRequests('-me-')).list.entries.map(e => e.entry.id);
      return requests.includes(siteId);
    } catch (error) {
      this.handleError(`${this.constructor.name} ${this.hasMembershipRequest.name}`, error);
      return null;
    }
  }

  async waitForApi(data: { expect: number }) {
    try {
      const sites = async () => {
        const totalItems = (await this.getSites()).list.pagination.totalItems;
        if ( totalItems !== data.expect ) {
            return Promise.reject(totalItems);
        } else {
            return Promise.resolve(totalItems);
        }
      };

      return await ApiUtil.retryCall(sites);
    } catch (error) {
      Logger.error(`${this.constructor.name} ${this.waitForApi.name} catch: `);
      Logger.error(`\tExpected: ${data.expect} items, but found ${error}`);
    }
  }
}
