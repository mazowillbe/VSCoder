import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';
import { createOperationNotification } from '../index';

// Get VS Code API tool
export function createGetVscodeApiTool(ai: Genkit) {
  return ai.defineTool({
    name: 'get_vscode_api',
    description: 'Get information about the VS Code API and available commands.',
    inputSchema: z.object({
      category: z.string().optional().describe('Category of API to explore (e.g., "window", "workspace", "commands")')
    }),
    outputSchema: z.object({
      apiInfo: z.object({
        version: z.string(),
        availableCommands: z.array(z.string()).optional(),
        workspaceInfo: z.object({
          name: z.string().optional(),
          folders: z.array(z.string()).optional(),
          configuration: z.any().optional()
        }).optional(),
        windowInfo: z.object({
          activeEditor: z.string().optional(),
          visibleEditors: z.array(z.string()).optional()
        }).optional()
      }).optional(),
      error: z.string().optional()
    }),
  }, async ({ category }: { category?: string }) => {
    try {
      // Create operation notification
      createOperationNotification('read', 'Getting VS Code API information', {
        category: category || 'all'
      });

      const apiInfo: any = {
        version: vscode.version
      };

      if (!category || category === 'commands') {
        try {
          const commands = await vscode.commands.getCommands();
          apiInfo.availableCommands = commands.slice(0, 50); // Limit to first 50 commands
        } catch (error) {
          apiInfo.availableCommands = ['Unable to fetch commands'];
        }
      }

      if (!category || category === 'workspace') {
        apiInfo.workspaceInfo = {
          name: vscode.workspace.name,
          folders: vscode.workspace.workspaceFolders?.map(folder => folder.name) || [],
          configuration: vscode.workspace.getConfiguration()
        };
      }

      if (!category || category === 'window') {
        apiInfo.windowInfo = {
          activeEditor: vscode.window.activeTextEditor?.document.fileName || 'None',
          visibleEditors: vscode.window.visibleTextEditors.map(editor => editor.document.fileName)
        };
      }

      return { apiInfo };
    } catch (error) {
      console.error('Error getting VS Code API info:', error);
      return { error: `Failed to get VS Code API info: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// Get errors tool
export function createGetErrorsTool(ai: Genkit) {
  return ai.defineTool({
    name: 'get_errors',
    description: 'Get current errors and warnings from the workspace diagnostics.',
    inputSchema: z.object({
      filePath: z.string().optional().describe('Specific file to get errors for (optional)'),
      includeWarnings: z.boolean().optional().describe('Whether to include warnings (defaults to true)')
    }),
    outputSchema: z.object({
      errors: z.array(z.object({
        file: z.string(),
        line: z.number(),
        message: z.string(),
        severity: z.string(),
        range: z.object({
          start: z.object({ line: z.number(), character: z.number() }),
          end: z.object({ line: z.number(), character: z.number() })
        })
      })).optional(),
      totalErrors: z.number().optional(),
      totalWarnings: z.number().optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath, includeWarnings = true }: { filePath?: string; includeWarnings?: boolean }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('read', 'Getting workspace errors', {
        filePath: filePath || 'all',
        includeWarnings
      });

      const allDiagnostics: any[] = [];
      let totalErrors = 0;
      let totalWarnings = 0;

      if (filePath) {
        // Get diagnostics for specific file
        const fullPath = path.join(workspaceRoot, filePath);
        const uri = vscode.Uri.file(fullPath);
        const diagnostics = vscode.languages.getDiagnostics(uri);
        
        diagnostics.forEach(diagnostic => {
          if (diagnostic.severity === vscode.DiagnosticSeverity.Error || 
              (includeWarnings && diagnostic.severity === vscode.DiagnosticSeverity.Warning)) {
            
            allDiagnostics.push({
              file: filePath,
              line: diagnostic.range.start.line + 1,
              message: diagnostic.message,
              severity: diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'warning',
              range: diagnostic.range
            });

            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
              totalErrors++;
            } else {
              totalWarnings++;
            }
          }
        });
      } else {
        // Get all diagnostics
        const diagnostics = vscode.languages.getDiagnostics();
        
        for (const [uri, fileDiagnostics] of diagnostics) {
          const relativePath = path.relative(workspaceRoot, uri.fsPath);
          
          fileDiagnostics.forEach(diagnostic => {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error || 
                (includeWarnings && diagnostic.severity === vscode.DiagnosticSeverity.Warning)) {
              
              allDiagnostics.push({
                file: relativePath,
                line: diagnostic.range.start.line + 1,
                message: diagnostic.message,
                severity: diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'warning',
                range: diagnostic.range
              });

              if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                totalErrors++;
              } else {
                totalWarnings++;
              }
            }
          });
        }
      }

      return {
        errors: allDiagnostics,
        totalErrors,
        totalWarnings
      };
    } catch (error) {
      console.error('Error getting errors:', error);
      return { error: `Failed to get errors: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// Get changed files tool
export function createGetChangedFilesTool(ai: Genkit) {
  return ai.defineTool({
    name: 'get_changed_files',
    description: 'Get information about files that have been modified in the current workspace using VS Code SCM API.',
    inputSchema: z.object({
      includeUntracked: z.boolean().optional().describe('Whether to include untracked files (defaults to true)'),
      includeStaged: z.boolean().optional().describe('Whether to include staged files (defaults to true)'),
      includeModified: z.boolean().optional().describe('Whether to include modified files (defaults to true)')
    }),
    outputSchema: z.object({
      changedFiles: z.array(z.object({
        filePath: z.string(),
        status: z.string(),
        resourceGroup: z.string().optional(),
        changes: z.object({
          additions: z.number().optional(),
          deletions: z.number().optional()
        }).optional()
      })).optional(),
      totalChanged: z.number().optional(),
      repositoryInfo: z.object({
        hasRepository: z.boolean(),
        repositoryType: z.string().optional()
      }).optional(),
      error: z.string().optional()
    }),
  }, async ({ includeUntracked = true, includeStaged = true, includeModified = true }: { includeUntracked?: boolean; includeStaged?: boolean; includeModified?: boolean }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('read', 'Getting changed files from source control', {
        includeUntracked,
        includeStaged,
        includeModified
      });

      const changedFiles: any[] = [];
      let totalChanged = 0;
      let hasRepository = false;
      let repositoryType = 'unknown';

      try {
        // Try to use VS Code's SCM API to get source control information
        // Note: VS Code SCM API is limited in extension context, so we'll focus on git detection
        const gitPath = path.join(workspaceRoot, '.git');
        if (fs.existsSync(gitPath)) {
          hasRepository = true;
          repositoryType = 'git';
        }
      } catch (scmError) {
        console.warn('SCM API not available, falling back to file system detection:', scmError);
      }

      // If no SCM data available, try to detect git repository manually
      if (!hasRepository) {
        const gitPath = path.join(workspaceRoot, '.git');
        if (fs.existsSync(gitPath)) {
          hasRepository = true;
          repositoryType = 'git';
          
          // Try to use git commands if available
          try {
            const { execSync } = require('child_process');
            
            // Get git status
            const gitStatus = execSync('git status --porcelain', { 
              cwd: workspaceRoot, 
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe']
            });
            
            const lines = gitStatus.trim().split('\n').filter((line: string) => line.length > 0);
            
            for (const line of lines) {
              const statusCode = line.substring(0, 2);
              const filePath = line.substring(3);
              
              let status = 'unknown';
              let shouldInclude = false;
              
              if (statusCode.startsWith('M') && includeModified) {
                status = 'modified';
                shouldInclude = true;
              } else if (statusCode.startsWith('A') && includeStaged) {
                status = 'staged';
                shouldInclude = true;
              } else if (statusCode.startsWith('??') && includeUntracked) {
                status = 'untracked';
                shouldInclude = true;
              } else if (statusCode.startsWith('D') && includeModified) {
                status = 'deleted';
                shouldInclude = true;
              }
              
              if (shouldInclude) {
                changedFiles.push({
                  filePath,
                  status,
                  resourceGroup: status === 'staged' ? 'index' : 'workingTree'
                });
                totalChanged++;
              }
            }
          } catch (gitError) {
            console.warn('Git command not available:', gitError);
          }
        }
      }

      return {
        changedFiles,
        totalChanged,
        repositoryInfo: {
          hasRepository,
          repositoryType
        }
      };
    } catch (error) {
      console.error('Error getting changed files:', error);
      return { error: `Failed to get changed files: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// Create new workspace tool
export function createCreateNewWorkspaceTool(ai: Genkit) {
  return ai.defineTool({
    name: 'create_new_workspace',
    description: 'Create a new workspace with specified configuration.',
    inputSchema: z.object({
      workspaceName: z.string().describe('Name of the new workspace'),
      workspaceType: z.enum(['empty', 'typescript', 'javascript', 'python', 'react', 'vue', 'angular']).describe('Type of workspace to create'),
      targetPath: z.string().optional().describe('Target path for the new workspace (optional)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      workspacePath: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ workspaceName, workspaceType, targetPath }: { workspaceName: string; workspaceType: string; targetPath?: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('write', `Creating new ${workspaceType} workspace: ${workspaceName}`, {
        workspaceName,
        workspaceType,
        targetPath: targetPath || 'default'
      });

      const basePath = targetPath || path.join(workspaceRoot, '..');
      const newWorkspacePath = path.join(basePath, workspaceName);

      // Create workspace directory
      if (!fs.existsSync(newWorkspacePath)) {
        fs.mkdirSync(newWorkspacePath, { recursive: true });
      }

      // Create basic workspace files based on type
      let packageJson = {};
      let readmeContent = '';

      switch (workspaceType) {
        case 'typescript':
          packageJson = {
            name: workspaceName,
            version: '1.0.0',
            description: 'TypeScript project',
            main: 'dist/index.js',
            scripts: {
              build: 'tsc',
              start: 'node dist/index.js',
              dev: 'ts-node src/index.ts'
            },
            devDependencies: {
              typescript: '^5.0.0',
              '@types/node': '^18.0.0',
              'ts-node': '^10.9.0'
            }
          };
          readmeContent = `# ${workspaceName}\n\nTypeScript project created with VS Code AI Assistant.`;
          break;

        case 'javascript':
          packageJson = {
            name: workspaceName,
            version: '1.0.0',
            description: 'JavaScript project',
            main: 'index.js',
            scripts: {
              start: 'node index.js',
              dev: 'nodemon index.js'
            },
            devDependencies: {
              nodemon: '^2.0.0'
            }
          };
          readmeContent = `# ${workspaceName}\n\nJavaScript project created with VS Code AI Assistant.`;
          break;

        case 'react':
          packageJson = {
            name: workspaceName,
            version: '1.0.0',
            description: 'React project',
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            },
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0'
            },
            devDependencies: {
              'react-scripts': '5.0.0'
            }
          };
          readmeContent = `# ${workspaceName}\n\nReact project created with VS Code AI Assistant.`;
          break;

        default:
          readmeContent = `# ${workspaceName}\n\nNew workspace created with VS Code AI Assistant.`;
      }

      // Write package.json if it's a Node.js project
      if (Object.keys(packageJson).length > 0) {
        fs.writeFileSync(path.join(newWorkspacePath, 'package.json'), JSON.stringify(packageJson, null, 2));
      }

      // Write README
      fs.writeFileSync(path.join(newWorkspacePath, 'README.md'), readmeContent);

      // Create .gitignore for common projects
      const gitignoreContent = `node_modules/\n.env\n.DS_Store\ndist/\nbuild/\n*.log`;
      fs.writeFileSync(path.join(newWorkspacePath, '.gitignore'), gitignoreContent);

      return {
        success: true,
        workspacePath: newWorkspacePath,
        message: `Successfully created ${workspaceType} workspace: ${workspaceName}`
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return { 
        success: false, 
        error: `Failed to create workspace: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Get project setup info tool
export function createGetProjectSetupInfoTool(ai: Genkit) {
  return ai.defineTool({
    name: 'get_project_setup_info',
    description: 'Get comprehensive information about the current project setup and configuration.',
    inputSchema: z.object({
      includeDependencies: z.boolean().optional().describe('Whether to include dependency information (defaults to true)'),
      includeConfig: z.boolean().optional().describe('Whether to include configuration files (defaults to true)')
    }),
    outputSchema: z.object({
      projectInfo: z.object({
        name: z.string().optional(),
        type: z.string().optional(),
        version: z.string().optional(),
        description: z.string().optional(),
        main: z.string().optional(),
        scripts: z.record(z.string()).optional(),
        dependencies: z.record(z.string()).optional(),
        devDependencies: z.record(z.string()).optional(),
        engines: z.record(z.string()).optional()
      }).optional(),
      configFiles: z.array(z.object({
        name: z.string(),
        path: z.string(),
        type: z.string()
      })).optional(),
      workspaceInfo: z.object({
        root: z.string().optional(),
        folders: z.array(z.string()).optional(),
        settings: z.any().optional()
      }).optional(),
      error: z.string().optional()
    }),
  }, async ({ includeDependencies = true, includeConfig = true }: { includeDependencies?: boolean; includeConfig?: boolean }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('read', 'Getting project setup information', {
        includeDependencies,
        includeConfig
      });

      const projectInfo: any = {};
      const configFiles: any[] = [];
      const workspaceInfo: any = {};

      // Get workspace info
      workspaceInfo.root = workspaceRoot;
      workspaceInfo.folders = vscode.workspace.workspaceFolders?.map(folder => folder.name) || [];
      workspaceInfo.settings = vscode.workspace.getConfiguration();

      // Check for package.json
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          projectInfo.name = packageJson.name;
          projectInfo.type = 'node';
          projectInfo.version = packageJson.version;
          projectInfo.description = packageJson.description;
          projectInfo.main = packageJson.main;
          projectInfo.scripts = packageJson.scripts;
          
          if (includeDependencies) {
            projectInfo.dependencies = packageJson.dependencies;
            projectInfo.devDependencies = packageJson.devDependencies;
            projectInfo.engines = packageJson.engines;
          }
        } catch (parseError) {
          console.warn('Failed to parse package.json:', parseError);
        }
      }

      // Check for other config files
      if (includeConfig) {
        const configFilePatterns = [
          'tsconfig.json', 'jsconfig.json', 'webpack.config.js', 'vite.config.js',
          'next.config.js', 'tailwind.config.js', 'eslint.config.js', '.eslintrc.js',
          'prettier.config.js', '.prettierrc', 'babel.config.js', 'rollup.config.js'
        ];

        configFilePatterns.forEach(configFile => {
          const configPath = path.join(workspaceRoot, configFile);
          if (fs.existsSync(configPath)) {
            configFiles.push({
              name: configFile,
              path: configPath,
              type: path.extname(configFile).substring(1)
            });
          }
        });
      }

      return {
        projectInfo,
        configFiles,
        workspaceInfo
      };
    } catch (error) {
      console.error('Error getting project setup info:', error);
      return { error: `Failed to get project setup info: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// Install extension tool
export function createInstallExtensionTool(ai: Genkit) {
  return ai.defineTool({
    name: 'install_extension',
    description: 'Install a VS Code extension by ID or marketplace URL using VS Code extension management API.',
    inputSchema: z.object({
      extensionId: z.string().describe('The extension ID to install (e.g., "ms-vscode.vscode-typescript-next")'),
      version: z.string().optional().describe('Specific version to install (optional)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional(),
      extensionInfo: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        version: z.string().optional(),
        isInstalled: z.boolean().optional()
      }).optional()
    }),
  }, async ({ extensionId, version }: { extensionId: string; version?: string }) => {
    try {
      // Create operation notification
      createOperationNotification('command', `Installing extension: ${extensionId}`, {
        extensionId,
        version: version || 'latest'
      });

      let extensionInfo: any = {};
      let isInstalled = false;

      try {
        // Check if extension is already installed
        const extensions = vscode.extensions.all;
        const existingExtension = extensions.find(ext => ext.id === extensionId);
        
        if (existingExtension) {
          isInstalled = true;
          extensionInfo = {
            id: existingExtension.id,
            name: existingExtension.packageJSON.displayName || existingExtension.packageJSON.name,
            version: existingExtension.packageJSON.version,
            isInstalled: true
          };
          
          return {
            success: true,
            message: `Extension ${extensionId} is already installed (version ${extensionInfo.version})`,
            extensionInfo
          };
        }
      } catch (checkError) {
        console.warn('Could not check existing extensions:', checkError);
      }

      // Try to install the extension using VS Code's command
      try {
        // Use VS Code's command to install extension
        const result = await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
        
        if (result) {
          extensionInfo = {
            id: extensionId,
            name: extensionId,
            version: version || 'latest',
            isInstalled: true
          };
          
          return {
            success: true,
            message: `Extension ${extensionId} installation initiated successfully`,
            extensionInfo
          };
        } else {
          return {
            success: false,
            message: `Extension installation command executed but no result returned`,
            extensionInfo: {
              id: extensionId,
              name: extensionId,
              version: version || 'latest',
              isInstalled: false
            }
          };
        }
      } catch (installError) {
        console.warn('Extension installation command failed:', installError);
        
        // Fallback: provide instructions for manual installation
        return {
          success: false,
          message: `Extension installation command failed. Please install manually: ${extensionId}`,
          extensionInfo: {
            id: extensionId,
            name: extensionId,
            version: version || 'latest',
            isInstalled: false
          }
        };
      }
    } catch (error) {
      console.error('Error installing extension:', error);
      return { 
        success: false, 
        error: `Failed to install extension: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Create new Jupyter notebook tool
export function createCreateNewJupyterNotebookTool(ai: Genkit) {
  return ai.defineTool({
    name: 'create_new_jupyter_notebook',
    description: 'Create a new Jupyter notebook file with specified content and metadata.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path where the notebook should be created'),
      notebookName: z.string().describe('Name of the notebook (without extension)'),
      language: z.enum(['python', 'javascript', 'typescript', 'r', 'julia']).optional().describe('Programming language for the notebook (defaults to python)'),
      initialContent: z.string().optional().describe('Initial content to add to the first cell')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      filePath: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath, notebookName, language = 'python', initialContent }: { filePath: string; notebookName: string; language?: string; initialContent?: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('write', `Creating new Jupyter notebook: ${notebookName}`, {
        filePath,
        notebookName,
        language,
        hasInitialContent: !!initialContent
      });

      const fullPath = path.join(workspaceRoot, filePath);
      const notebookPath = path.join(fullPath, `${notebookName}.ipynb`);

      // Ensure directory exists
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      // Create notebook content
      const notebookContent = {
        cells: [
          {
            cell_type: 'markdown',
            metadata: {},
            source: [`# ${notebookName}\n\nCreated with VS Code AI Assistant.`]
          }
        ],
        metadata: {
          kernelspec: {
            display_name: language === 'python' ? 'Python 3' : language,
            language: language,
            name: language === 'python' ? 'python3' : language
          },
          language_info: {
            codemirror_mode: language === 'python' ? 'python' : language,
            file_extension: language === 'python' ? '.py' : `.${language}`,
            mimetype: language === 'python' ? 'text/x-python' : `text/x-${language}`,
            name: language,
            nbconvert_exporter: language === 'python' ? 'python' : language,
            pygments_lexer: language === 'python' ? 'ipython3' : language,
            version: '3.8.0'
          }
        },
        nbformat: 4,
        nbformat_minor: 4
      };

      // Add initial content cell if provided
      if (initialContent) {
        notebookContent.cells.push({
          cell_type: 'code',
          metadata: {},
          source: [initialContent]
        });
      }

      // Write notebook file
      fs.writeFileSync(notebookPath, JSON.stringify(notebookContent, null, 2));

      return {
        success: true,
        filePath: path.relative(workspaceRoot, notebookPath),
        message: `Successfully created Jupyter notebook: ${notebookName}.ipynb`
      };
    } catch (error) {
      console.error('Error creating notebook:', error);
      return { 
        success: false, 
        error: `Failed to create notebook: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}
