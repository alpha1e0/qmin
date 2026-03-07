import { registerCommonHandlers } from './common.handler';
import { registerMdEditorHandlers } from './md-editor.handler';
import { registerIvViewerHandlers } from './iv-viewer.handler';
import { registerRoleplayHandlers } from './roleplay.handler';
import { registerImgGenHandlers } from './img-gen.handler';

/**
 * Register all IPC handlers
 */
export function registerAllHandlers(): void {
  registerCommonHandlers();
  registerMdEditorHandlers();
  registerIvViewerHandlers();
  registerRoleplayHandlers();
  registerImgGenHandlers();
}
