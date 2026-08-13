import type { Meta, StoryObj } from '@storybook/react-vite';
import { TOKEN_GROUPS, ALL_TOKENS, type ThemeTokenGroup } from '../../../scripts/theme-tokens.mjs';
import { TokenSwatch, SwatchGrid, Section } from './Swatch';

/**
 * The `--fp-*` token layer, rendered straight from `scripts/theme-tokens.mjs` — the same table that
 * generates the CSS block in `src/index.css` and is asserted against the Tailwind palette by
 * `scripts/verify-theme-tokens.mjs`. Adding a token there makes it appear here automatically.
 *
 * Swatches read their live computed value, so the light/dark toolbar switches every one of them.
 */
const meta: Meta = {
	title: 'Design System/Tokens',
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Semantic colour tokens. Never hardcode a hex — reach for the token whose *name* describes ' +
					'the role (`surface-canvas`, `content-muted`, `line`), and dark mode follows for free.',
			},
		},
	},
};

export default meta;
type Story = StoryObj;

/** Group headings read `'Surfaces — backgrounds. …'`; split the label from its rationale. */
const splitHeading = (heading: string): [string, string | undefined] => {
	const [title, description] = heading.split(/ — (.+)/);
	return [title, description];
};

function GroupBlock({ group }: { group: ThemeTokenGroup }) {
	const [title, description] = splitHeading(group.group);
	return (
		<Section title={title} description={description}>
			<SwatchGrid>
				{group.tokens.map((token) => (
					<TokenSwatch key={token.name} name={token.name} note={token.note} />
				))}
			</SwatchGrid>
		</Section>
	);
}

/**
 * Selects groups by heading prefix rather than array index, so reordering or inserting a group in
 * `theme-tokens.mjs` can't silently point a story at the wrong swatches.
 */
const groupsMatching = (...prefixes: string[]): ThemeTokenGroup[] =>
	TOKEN_GROUPS.filter((g) => prefixes.some((p) => g.group.startsWith(p)));

const storyFor = (...prefixes: string[]): Story => ({
	render: () => {
		const groups = groupsMatching(...prefixes);
		if (groups.length === 0) {
			return <p className='text-sm text-content-muted'>No token group matches {prefixes.join(' / ')} — check scripts/theme-tokens.mjs.</p>;
		}
		return (
			<div>
				{groups.map((group) => (
					<GroupBlock key={group.group} group={group} />
				))}
			</div>
		);
	},
});

export const AllTokens: Story = {
	name: `All tokens (${ALL_TOKENS.length})`,
	render: () => (
		<div>
			{TOKEN_GROUPS.map((group) => (
				<GroupBlock key={group.group} group={group} />
			))}
		</div>
	),
};

export const Surfaces = storyFor('Surfaces');
export const Content = storyFor('Content');
export const Lines = storyFor('Lines');
export const Status = storyFor('Status');
export const Accents = storyFor('Accents');
export const AppShell = storyFor('App shell');
export const Charts = storyFor('Charts');
export const Brand = storyFor('Brand');
