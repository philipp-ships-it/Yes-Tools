import { HeadlessTools } from './headlessTools';
import { useAppStore } from '../store/appStore';

export const cocreatorTools = [
  {
    type: 'function',
    function: {
      name: 'read_app_state',
      description: 'Reads the current global state of the app tools. Use this to see what text the user is currently working on in other tools.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_app_state',
      description: 'Sets the current global state of the app tools. Use this to pre-fill or modify inputs across the app.',
      parameters: {
        type: 'object',
        properties: {
          updates: {
            type: 'object',
            description: 'Key-value pairs of state variables to update (e.g., devFmInput, compareText1).'
          }
        },
        required: ['updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigates the user to a different tool route.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            enum: ['/', '/htmltools', '/wordtohtml', '/imagetools', '/performancetools', '/devtools', '/shytool', '/textcompare', '/cocreator']
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'format_code',
      description: 'Formats and beautifies HTML, CSS, or JS code.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          language: { type: 'string', enum: ['html', 'css', 'js'] }
        },
        required: ['code', 'language']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'encode_decode',
      description: 'Encodes or decodes text (Base64, URL, Hex, HTML Entities).',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' },
          type: { type: 'string', enum: ['base64', 'url', 'hex', 'html'] },
          action: { type: 'string', enum: ['encode', 'decode'] }
        },
        required: ['input', 'type', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'smart_typography',
      description: 'Applies smart typography fixes (non-breaking spaces for units, abbreviations, etc.) to German text.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string' }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compare_text',
      description: 'Compares two text strings and returns the differences. Returns a structured diff.',
      parameters: {
        type: 'object',
        properties: {
          textA: { type: 'string' },
          textB: { type: 'string' }
        },
        required: ['textA', 'textB']
      }
    }
  }
];

export const executeTool = async (name: string, args: any, navigate: any) => {
  const store = useAppStore.getState();
  
  switch (name) {
    case 'read_app_state':
      return JSON.stringify(store);
      
    case 'set_app_state':
      // Very loose setting, but valid for remote control
      useAppStore.setState((state) => ({ ...state, ...args.updates }));
      return JSON.stringify({ success: true, updatedKeys: Object.keys(args.updates) });

    case 'navigate_to':
      navigate(args.path);
      return JSON.stringify({ success: true, navigatedTo: args.path });

    case 'format_code':
      return HeadlessTools.formatCode(args.code, args.language);

    case 'encode_decode':
      return HeadlessTools.encodeDecode(args.input, args.type, args.action);

    case 'smart_typography':
      return HeadlessTools.smartTypography(args.text);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};
