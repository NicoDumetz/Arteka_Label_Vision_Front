/* Helpers */
import Api from "~/helpers/api/index";

/* Types */
import type { ApiRequest } from "~/types/api";

// TEMPLATE D'API CALL

export class Bookmarks {
  static endpoint = "/tbx/account/bookmarks";

  static getBookmarks(): ApiRequest<string[]> {
    return Api.get<string[]>(Bookmarks.endpoint);
  }

  static addBookmark(bookmark: string): ApiRequest<string> {
    return Api.post<string, { bookmark: string }>(Bookmarks.endpoint, { bookmark });
  }

  static deleteBookmark(bookmark: string): ApiRequest<string> {
    return Api.delete<string>(`${Bookmarks.endpoint}?bookmark=${encodeURIComponent(bookmark)}`);
  }
}
