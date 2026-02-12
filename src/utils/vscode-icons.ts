
const LOCAL_ICONS_PATH = '/vscode-icons';

// Mapping of file extensions to icon names
const EXTENSION_MAP: Record<string, string> = {
    // Web
    'ts': 'file_type_typescript.svg',
    'tsx': 'file_type_reactts.svg',
    'js': 'file_type_js.svg',
    'jsx': 'file_type_reactjs.svg',
    'css': 'file_type_css.svg',
    'scss': 'file_type_scss.svg',
    'html': 'file_type_html.svg',
    'json': 'file_type_json.svg',

    // Systems
    'rs': 'file_type_rust.svg',
    'toml': 'file_type_light_toml.svg', // Use light optimized for dark background
    'yaml': 'file_type_yaml.svg',
    'yml': 'file_type_yaml.svg',
    'lock': 'file_type_rust.svg', // Cargo.lock

    // Configs
    'gitignore': 'file_type_git.svg',
    'md': 'file_type_markdown.svg',
    'env': 'file_type_light_config.svg'
};

// Mapping of exact filenames (overrides extensions)
const FILENAME_MAP: Record<string, string> = {
    'Cargo.toml': 'file_type_light_toml.svg',
    'package.json': 'file_type_npm.svg',
    'tsconfig.json': 'file_type_tsconfig.svg',
    'README.md': 'file_type_markdown.svg',
    'LICENSE': 'file_type_license.svg'
};

export const getFileIconUrl = (filename: string): string => {
    // 1. Check exact filename match
    if (FILENAME_MAP[filename]) {
        return `${LOCAL_ICONS_PATH}/${FILENAME_MAP[filename]}`;
    }

    // 2. Check extension match
    const parts = filename.split('.');
    if (parts.length > 1) {
        const ext = parts.pop()?.toLowerCase();
        if (ext && EXTENSION_MAP[ext]) {
            return `${LOCAL_ICONS_PATH}/${EXTENSION_MAP[ext]}`;
        }
    }

    // 3. Fallback
    return `${LOCAL_ICONS_PATH}/default_file.svg`;
};
