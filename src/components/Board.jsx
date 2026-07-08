import Tile from "./Tile";

/* eslint-disable react/prop-types */

const Board = ({ grid, newTiles, mergedTiles }) => {
  return (
    <div className="board-shell">
      <div className="board-grid">
        {grid.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              value={value}
              isNew={newTiles.some(([r, c]) => r === rowIndex && c === colIndex)}
              isMerged={mergedTiles.some(
                ([r, c]) => r === rowIndex && c === colIndex
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Board;
