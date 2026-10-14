import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { firstNameOf, type ExploreTile, type User } from '../../data/types';
import { colors, fonts } from '../../theme';
import { Avatar } from '../ui';

export type MasonryGridProps = {
  tiles: ExploreTile[];
  /** Image URL for a tile (exploreTileUrl(tile, topicIndex)). */
  urlOf: (tile: ExploreTile) => string;
  person: (userId: string) => User;
};

/**
 * Explore masonry (SPEC 3.08): two columns, gap 8, padding 0 16. The CSS
 * column balance puts tiles a-d on the left and e-h on the right. Each tile
 * keeps its listed height. Tiles are not tappable in the design.
 */
export function MasonryGrid({ tiles, urlOf, person }: MasonryGridProps) {
  const half = Math.ceil(tiles.length / 2);
  const columns = [tiles.slice(0, half), tiles.slice(half)];
  return (
    <View style={styles.grid}>
      {columns.map((col, ci) => (
        <View key={ci} style={styles.column}>
          {col.map(tile => (
            <Tile
              key={tile.seed}
              tile={tile}
              uri={urlOf(tile)}
              author={person(tile.authorId)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({
  tile,
  uri,
  author,
}: {
  tile: ExploreTile;
  uri: string;
  author: User;
}) {
  const first = firstNameOf(author.name);
  return (
    <View
      style={[styles.tile, { height: tile.height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Photo from ${first}`}
    >
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.chip}>
        <Avatar uri={author.photoUrl} name={author.name} size={18} />
        <Text style={styles.chipText} numberOfLines={1}>
          {first}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  column: { flex: 1 },
  tile: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  image: { width: '100%', height: '100%' },
  chip: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 3,
    paddingRight: 8,
    paddingBottom: 3,
    paddingLeft: 3,
    borderRadius: 999,
    backgroundColor: colors.scrim50,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.onAccent,
  },
});
