import { Account, Folder } from "@/types";

export const isFolder = (item: Account | Folder): item is Folder => {
  return (item as Account).secret === undefined;
};
