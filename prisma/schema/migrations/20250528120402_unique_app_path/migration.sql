/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `App` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "App_path_key" ON "App"("path");
